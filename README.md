# CompleteDiscovery Server Setup Guide

This guide explains how to install and configure **Nginx**, **Node.js**, **MongoDB**, **Elasticsearch**, and **Certbot** to run the CompleteDiscovery project.

---

## 1. Install and Configure Nginx

```bash
sudo yum install nginx
sudo systemctl start nginx
```

After installation, open **http://completediscovery.com** in your browser to verify.

If it doesn’t load, port 80 might be in use. Stop and disable Apache (`httpd`) service:

```bash
sudo systemctl stop httpd
sudo systemctl disable httpd
sudo systemctl enable nginx
```

> This ensures Nginx starts automatically after a reboot.

---

### Edit Nginx Configuration

Open and edit `/etc/nginx/nginx.conf`:

```bash
sudo nano /etc/nginx/nginx.conf
```

Replace the **server block** with the following:

```nginx
server {
    server_name  completediscovery.com www.completediscovery.com;
    root         /usr/share/nginx/html;

    include /etc/nginx/default.d/*.conf;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    error_page 404 /404.html;
    location = /404.html { }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html { }
}
```

---

## 2. Install Node.js (via NVM)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.profile
nvm install 16.13.1
```

---

## 3. Install MongoDB

Follow the official MongoDB installation guide:  
[MongoDB on Red Hat](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-red-hat/)

Create a repo file:

```bash
sudo nano /etc/yum.repos.d/mongodb-org-8.0.repo
```

Paste the following content:

```ini
[mongodb-org-8.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/9/mongodb-org/8.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://pgp.mongodb.com/server-8.0.asc
```

Then install MongoDB:

```bash
sudo yum install -y mongodb-org
```

Change the default MongoDB port for security:

```bash
sudo nano /etc/mongod.conf
```

Update:
```
port: 8756
```

Start and enable MongoDB:

```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

---

## 4. Install Elasticsearch

Official guide: [Elasticsearch RPM Install](https://www.elastic.co/guide/en/elasticsearch/reference/current/rpm.html#rpm-repo)

Import GPG key:

```bash
rpm --import https://artifacts.elastic.co/GPG-KEY-elasticsearch
```

Create a repo file:

```bash
sudo nano /etc/yum.repos.d/elasticsearch.repo
```

Add the following:

```ini
[elasticsearch]
name=Elasticsearch repository for 8.x packages
baseurl=https://artifacts.elastic.co/packages/8.x/yum
gpgcheck=1
gpgkey=https://artifacts.elastic.co/GPG-KEY-elasticsearch
enabled=0
autorefresh=1
type=rpm-md
```

Install Elasticsearch:

```bash
sudo yum install --enablerepo=elasticsearch elasticsearch
```

### Common Issues

**If keystore issue:**
```bash
sudo rm -rf /etc/elasticsearch/elasticsearch.keystore
sudo chmod 1777 /etc/elasticsearch
```

**If native library issue:**
`Failed to load native library: jansi-2.4.0-xxxx-libjansi.so`

Edit `/etc/elasticsearch/jvm.options` and replace:
```
#-Djava.io.tmpdir=${ES_TMPDIR}
-Djava.io.tmpdir=/var/log/elasticsearch
```

**Disable xpack security:**

```bash
sudo nano /etc/elasticsearch/elasticsearch.yml
```

Add this line at the end:
```
xpack.security.enabled: false
```

Start and enable Elasticsearch:

```bash
sudo systemctl start elasticsearch
sudo systemctl status elasticsearch
sudo systemctl enable elasticsearch
```

---

## 5. AWS S3 Configuration

```bash
export AWS_ACCESS_KEY_ID=<Access_Key_ID>
export AWS_SECRET_ACCESS_KEY=<Secret_Access_Key>
```

---

## 6. Download and Setup the Project

```bash
git clone https://github.com/joec6611/CompleteDiscovery
```

When prompted, enter your GitHub username and token.

Install dependencies and build:

```bash
cd Evestigate
npm i --legacy-peer-deps
npm run build
```

Then start the server setup:

```bash
cd Server
npm i
```

---

## 7. Run the Project with PM2

Install PM2 globally:

```bash
npm i pm2 -g
```

Start the Node.js server in the background:

```bash
cd Evestigate/Server
pm2 start app.js
```

Check PM2 status:

```bash
pm2 status
```

---

## 8. Enable SSL with Certbot

Install Certbot for Nginx:

```bash
sudo yum install certbot python3-certbot-nginx
```

Request SSL certificates:

```bash
sudo certbot certonly --nginx --preferred-chain "ISRG Root X1" --force-renewal -d completediscovery.com -d www.completediscovery.com
```

Reload Nginx to apply SSL:

```bash
sudo systemctl reload nginx
```

---

✅ **Setup Complete!**

Your CompleteDiscovery server should now be running with:
- **Nginx reverse proxy on port 80/443**
- **Node.js (via PM2) on port 8000**
- **MongoDB on port 8756**
- **Elasticsearch running locally**
- **HTTPS (Certbot) configured for completediscovery.com**
