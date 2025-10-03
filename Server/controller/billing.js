const { Client, WebhooksHelper  } = require('square');
const crypto = require('crypto');
const config = require("../config/app.config");
const User = require("../models/user");
const SubscriptionPlan = require('../models/admin/subscription');
const SubscriptionHistory = require('../models/subscription_history');
const Utils = require('./utils');

const client = new Client({
  accessToken: config.SQUARE_INFO.accessToken,
  environment: config.SQUARE_INFO.environment
});

BigInt.prototype.toJSON = function() { return this.toString(); }

// Helper function to get next billing date
const getNextBillingDate = (startDate) => {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 1);
  return date.toISOString().split('T')[0];
};

const cancelAllSubscriptions = async (customerId) => {
  const { result: { subscriptions } } = await client.subscriptionsApi.searchSubscriptions({
    query: {
      filter: {
        customerIds: [
          customerId
        ],
        locationIds: [
          config.SQUARE_INFO.locationId
        ]
      }
    }
  });

  if (subscriptions) {
    for (const subscription of subscriptions) {
      if (subscription.status === 'ACTIVE' && !subscription.canceledDate) {
        console.log('unscubsribing')
        const res = await client.subscriptionsApi.cancelSubscription(subscription.id);
        console.log(res.status)
      }
    }
  }
}

exports.customerStatus = async (customerId, subscriptionId, user) => {
  try {
    const { result: { customer } } = await client.customersApi.retrieveCustomer(customerId);
    const { result: { subscriptions } } = await client.subscriptionsApi.searchSubscriptions({
      query: {
        filter: {
          customerIds: [
            customerId
          ],
          locationIds: [
            config.SQUARE_INFO.locationId
          ]
        }
      }
    });

    console.log("Subscriptions: ", subscriptions)

    // find the first active subscription for the current plan
    // In the current workflow of the example, we don't allow more than one active subscription for each customer
    // so we'll assume we can rely on the first active subscription if there are multiple
    const activeSubscription = subscriptions ?
      Object.values(subscriptions).find((subscription) => {
        return subscription.id === subscriptionId
          && (subscription.status === "ACTIVE" || subscription.status === "PENDING");
      }) : null;
      console.log("Active Subscription:", activeSubscription)
      if (!activeSubscription) {
        user.isSubscribed = false
        user.subscriptionStatus = 'CANCELED'
        await user.save()
      }

    return activeSubscription;
  } catch (error) {
    console.log(error)

    return null
  }
}

// Create subscription
exports.createSubscription = async (req, res) => {
  const { sourceId, planId, planVariationId } = req.body;
  const userId = req.userId;
  
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    // Cancel existing subscription if any
    if (user.customerID) {
      try {
        await cancelAllSubscriptions(user.customerID);
      } catch (error) {
        console.log('Error canceling existing subscription:', error);
      }
    }

    // Create customer if not exists
    if (!user.customerID) {
      const response = await client.customersApi.createCustomer({
        givenName: user.firstName || 'User',
        familyName: user.lastName || user.email.split('@')[0],
        emailAddress: user.email,
        referenceId: user._id.toString()
      });
      
      if (response.statusCode === 200) {
        user.customerID = response.result.customer.id;
        await user.save();
      }
    }

    // Create subscription
    const subscriptionResponse = await client.subscriptionsApi.createSubscription({
      locationId: config.SQUARE_INFO.locationId,
      planVariationId: planVariationId,
      customerId: user.customerID,
      idempotencyKey: crypto.randomUUID(),
      sourceId,
    });

    if (subscriptionResponse.statusCode === 200) {
      const subscription = subscriptionResponse.result.subscription;
      
      user.subscriptionID = subscription.id;
      user.isSubscribed = true;
      user.planID = planId;
      user.isFreeTrial = false;
      user.subscriptionStatus = subscription.status;
      user.subscriptionCanceledDate = ''
      user.subscriptionStatus = 'ACTIVE'
      await user.save();

      const subscriptionPlan = await SubscriptionPlan.findOne({ planId });
      const nextBillingDate = getNextBillingDate(subscription.startDate);

      // Send confirmation email
      await Utils.sendSubscriptionSucceed(user.email, user, {
        benefit: subscriptionPlan?.items?.map((it) => `<li>${it}</li>`).join('') || '',
        subscriptionTitle: subscriptionPlan?.title || 'Subscription',
        startDate: subscription.startDate,
        nextBillingDate: nextBillingDate,
        createdAt: subscription.createdAt,
        id: subscription.id,
      });

      return res.status(200).json({ 
        ok: true, 
        data: subscription,
        message: 'Subscription created successfully' 
      });
    }

  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ 
      ok: false, 
      message: error.message || 'Failed to create subscription' 
    });
  }
};

// Get subscription plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.json({ ok: true, data: plans || [] });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to fetch plans' });
  }
};

// Unsubscribe
exports.unsubscribe = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.subscriptionID) {
      return res.status(404).json({ ok: false, message: 'No active subscription found' });
    }

    const resp = await client.subscriptionsApi.retrieveSubscription(user.subscriptionID);
    let flag = false
    let canceledDate = null
    if (resp.result.subscription) {
      if (resp.result.subscription.canceledDate) {
        flag = true 
        canceledDate = resp.result.subscription.canceledDate
      } else if (resp.result.subscription.status === 'ACTIVE') {
        const response = await client.subscriptionsApi.cancelSubscription(user.subscriptionID);
        if (response.statusCode === 200) { 
          canceledDate = response.result.subscription.canceledDate
          await cancelAllSubscriptions(user.customerID)
          flag = true
        }
      }
    }

    if (flag) {
      user.isSubscribed = true;
      user.subscriptionStatus = 'CANCELED';
      user.subscriptionCanceledDate = canceledDate
      await user.save();
      
      await Utils.sendSubscriptionCancelled(user.email, user, {
        effectiveDate: canceledDate
      });

      return res.json({ 
        ok: true, 
        message: 'Subscription cancelled successfully' 
      });
    }

    res.status(400).json({ 
      ok: false, 
      message: 'Failed to cancel subscription' 
    });
    
  } catch (error) {
    console.error('Unsubscribe error:', error);
    let errmsg = 'Failed to unsubscribe'
    if (error.errors?.length) {
      errmsg = error.errors[0].detail
    }
    return res.status(500).json({ 
      ok: false, 
      message: errmsg
    });
  }
};

// Webhook handler
exports.subscriptionHook = async (req, res) => {
  try {
    const event = req.body;
    console.log('Received Square Webhook:', event);

    // Save webhook event
    await SubscriptionHistory.create({
      eventId: event.event_id,
      eventType: event.type,
      eventCreated: event.created_at,
      dataType: event.data?.type,
      dataId: event.data?.id,
      data: event.data?.object
    });

    // Handle different webhook events
    if (event.type === 'subscription.updated') {
      const subscription = event.data.object.subscription;
      const user = await User.findOne({ subscriptionID: subscription.id });
      
      if (user) {
        user.subscriptionStatus = subscription.status;
        
        if (subscription.status === 'CANCELED') {
          user.isSubscribed = false;
          user.planID = '';
          user.subscriptionID = '';
        }
        
        await user.save();
      }
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook processing failed');
  }
};

// Get user subscription details
exports.getSubscriptionDetails = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.subscriptionID) {
      return res.json({ ok: true, data: null });
    }

    const subscription = await client.subscriptionsApi.retrieveSubscription(user.subscriptionID);
    res.json({ ok: true, data: subscription.result });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Failed to fetch subscription details' });
  }
};