export declare const enum MessageImportance {
    IMPORTANCE_LOW = 0,
    IMPORTANCE_NORMAL = 1,
    IMPORTANCE_HIGH = 2
}
export declare const enum MessageIconIndex {
    NewMail = 0,
    Post = 1,
    Other = 3,
    ReadMail = 256,
    UnreadMail = 257,
    SubmittedMail = 258,
    UnsentMail = 259,
    ReceiptMail = 260,
    RepliedMail = 261,
    ForwardedMail = 262,
    RemoteMail = 263,
    DeliveryReceipt = 264,
    ReadReceipt = 265,
    NondeliveryReport = 266,
    NonReadReceipt = 267,
    RecallSMail = 268,
    RecallFMail = 269,
    TrackingMail = 270,
    OutOfOfficeMail = 283,
    RecallMail = 284,
    TrackedMail = 304,
    Contact = 512,
    DistributionList = 514,
    StickyNoteBlue = 768,
    StickyNoteGreen = 769,
    StickyNotePink = 770,
    StickyNoteYellow = 771,
    StickyNoteWhite = 772,
    SingleInstanceAppointment = 1024,
    RecurringAppointment = 1025,
    SingleInstanceMeeting = 1026,
    RecurringMeeting = 1027,
    MeetingRequest = 1028,
    Accept = 1029,
    Decline = 1030,
    Tentatively = 1031,
    Cancellation = 1032,
    InformationalUpdate = 1033,
    TaskTask = 1280,
    UnassignedRecurringTask = 1281,
    AssigneesTask = 1282,
    AssignersTask = 1283,
    TaskRequest = 1284,
    TaskAcceptance = 1285,
    TaskRejection = 1286,
    JournalConversation = 1537,
    JournalEmailMessage = 1538,
    JournalMeetingRequest = 1539,
    JournalMeetingResponse = 1540,
    JournalTaskRequest = 1542,
    JournalTaskResponse = 1543,
    JournalNote = 1544,
    JournalFax = 1545,
    JournalPhoneCall = 1546,
    JournalLetter = 1548,
    JournalMicrosoftOfficeWord = 1549,
    JournalMicrosoftOfficeExcel = 1550,
    JournalMicrosoftOfficePowerPoint = 1551,
    JournalMicrosoftOfficeAccess = 1552,
    JournalDocument = 1554,
    JournalMeeting = 1555,
    JournalMeetingCancellation = 1556,
    JournalRemoteSession = 1557
}
export declare type AddressType = "" | "EX" | "SMTP" | "FAX" | "MHS" | "PROFS" | "X400";
export declare const enum MapiObjectType {
    MAPI_ABCONT = 4,
    MAPI_ADDRBOOK = 2,
    MAPI_ATTACH = 7,
    MAPI_DISTLIST = 8,
    MAPI_FOLDER = 3,
    MAPI_FORMINFO = 12,
    MAPI_MAILUSER = 6,
    MAPI_MESSAGE = 5,
    MAPI_PROFSECT = 9,
    MAPI_SESSION = 11,
    MAPI_STATUS = 10,
    MAPI_STORE = 1
}
export declare const enum RecipientRowDisplayType {
    MessagingUser = 0,
    DistributionList = 1,
    Forum = 2,
    AutomatedAgent = 3,
    AddressBook = 4,
    PrivateDistributionList = 5,
    RemoteAddressBook = 6
}
export declare const enum RecipientType {
    Originator = 0,
    To = 1,
    Cc = 2,
    Bcc = 3,
    Resource = 4,
    Room = 7
}
export declare const enum RecipientFlags {
    RecipSendable = 1,
    RecipOrganizer = 2,
    RecipExceptionalResponse = 16,
    RecipExceptionalDeleted = 32,
    RecipOriginal = 256
}
export declare enum PropertyType {
    PT_UNSPECIFIED = 0,
    PT_NULL = 1,
    PT_SHORT = 2,
    PT_LONG = 3,
    PT_FLOAT = 4,
    PT_DOUBLE = 5,
    PT_APPTIME = 7,
    PT_ERROR = 10,
    PT_BOOLEAN = 11,
    PT_OBJECT = 13,
    PT_I8 = 20,
    PT_LONGLONG = 20,
    PT_UNICODE = 31,
    PT_STRING8 = 30,
    PT_SYSTIME = 64,
    PT_CLSID = 72,
    PT_SVREID = 251,
    PT_SRESTRICT = 253,
    PT_ACTIONS = 254,
    PT_BINARY = 258,
    PT_MV_SHORT = 4098,
    PT_MV_LONG = 4099,
    PT_MV_FLOAT = 4100,
    PT_MV_DOUBLE = 4101,
    PT_MV_CURRENCY = 4102,
    PT_MV_APPTIME = 4103,
    PT_MV_LONGLONG = 4116,
    PT_MV_TSTRING = 4127,
    PT_MV_UNICODE = 4127,
    PT_MV_STRING8 = 4126,
    PT_MV_SYSTIME = 4160,
    PT_MV_CLSID = 4168,
    PT_MV_BINARY = 4354
}
export declare const enum PropertyFlag {
    PROPATTR_MANDATORY = 1,
    PROPATTR_READABLE = 2,
    PROPATTR_WRITABLE = 4
}
export declare const enum MessageClass {
    Unknown = "",
    IPM_Note = "IPM.Note",
    IPM_Note_SMIME = "IPM.Note.SMIME",
    IPM_Note_SMIME_MultipartSigned = "IPM.Note.SMIME.MultipartSigned",
    IPM_Note_Receipt_SMIME = "IPM.Note.Receipt.SMIME",
    IPM_Post = "IPM.Post",
    IPM_Octel_Voice = "IPM.Octel.Voice",
    IPM_Voicenotes = "IPM.Voicenotes",
    IPM_Sharing = "IPM.Sharing",
    REPORT_IPM_NOTE_NDR = "REPORT.IPM.NOTE.NDR",
    REPORT_IPM_NOTE_DR = "REPORT.IPM.NOTE.DR",
    REPORT_IPM_NOTE_DELAYED = "REPORT.IPM.NOTE.DELAYED",
    REPORT_IPM_NOTE_IPNRN = "*REPORT.IPM.NOTE.IPNRN",
    REPORT_IPM_NOTE_IPNNRN = "*REPORT.IPM.NOTE.IPNNRN",
    REPORT_IPM_SCHEDULE_MEETING_REQUEST_NDR = "REPORT.IPM.SCHEDULE. MEETING.REQUEST.NDR",
    REPORT_IPM_SCHEDULE_MEETING_RESP_POS_NDR = "REPORT.IPM.SCHEDULE.MEETING.RESP.POS.NDR",
    REPORT_IPM_SCHEDULE_MEETING_RESP_TENT_NDR = "REPORT.IPM.SCHEDULE.MEETING.RESP.TENT.NDR",
    REPORT_IPM_SCHEDULE_MEETING_CANCELED_NDR = "REPORT.IPM.SCHEDULE.MEETING.CANCELED.NDR",
    REPORT_IPM_NOTE_SMIME_NDR = "REPORT.IPM.NOTE.SMIME.NDR",
    REPORT_IPM_NOTE_SMIME_DR = "*REPORT.IPM.NOTE.SMIME.DR",
    REPORT_IPM_NOTE_SMIME_MULTIPARTSIGNED_NDR = "*REPORT.IPM.NOTE.SMIME.MULTIPARTSIGNED.NDR",
    REPORT_IPM_NOTE_SMIME_MULTIPARTSIGNED_DR = "*REPORT.IPM.NOTE.SMIME.MULTIPARTSIGNED.DR",
    IPM_Appointment = "IPM.Appointment",
    IPM_Task = "IPM.Task"
}
export declare enum MessageEditorFormat {
    EDITOR_FORMAT_DONTKNOW = 0,
    EDITOR_FORMAT_PLAINTEXT = 1,
    EDITOR_FORMAT_HTML = 2,
    EDITOR_FORMAT_RTF = 3
}
export declare const enum MessageFormat {
    TextOnly = 0,
    HtmlOnly = 1,
    TextAndHtml = 2
}
export declare const enum MessagePriority {
    PRIO_NONURGENT = 0,
    PRIO_NORMAL = 1,
    PRIO_URGENT = 2
}
export declare enum AttachmentType {
    NO_ATTACHMENT = 0,
    ATTACH_BY_VALUE = 1,
    ATTACH_BY_REFERENCE = 2,
    ATTACH_BY_REF_RESOLVE = 3,
    ATTACH_BY_REF_ONLY = 4,
    ATTACH_EMBEDDED_MSG = 5,
    ATTACH_OLE = 6
}
export declare const enum AttachmentFlags {
    ATT_INVISIBLE_IN_HTML = 1,
    ATT_INVISIBLE_IN_RTF = 2,
    ATT_MHTML_REF = 4
}
export declare const enum StoreSupportMask {
    STORE_ANSI_OK = 131072,
    STORE_ATTACH_OK = 32,
    STORE_CATEGORIZE_OK = 1024,
    STORE_CREATE_OK = 16,
    STORE_ENTRYID_UNIQUE = 1,
    STORE_HTML_OK = 65536,
    STORE_ITEMPROC = 2097152,
    STORE_LOCALSTORE = 524288,
    STORE_MODIFY_OK = 8,
    STORE_MV_PROPS_OK = 512,
    STORE_NOTIFY_OK = 256,
    STORE_OLE_OK = 64,
    STORE_PUBLIC_FOLDERS = 16384,
    STORE_PUSHER_OK = 8388608,
    STORE_READONLY = 2,
    STORE_RESTRICTION_OK = 4096,
    STORE_RTF_OK = 2048,
    STORE_SEARCH_OK = 4,
    STORE_SORT_OK = 8192,
    STORE_SUBMIT_OK = 128,
    STORE_UNCOMPRESSED_RTF = 32768,
    STORE_UNICODE_OK = 262144
}
export declare const StoreSupportMaskConst: number;
export declare const enum MailPriority {
    High = 2,
    Low = 1,
    Normal = 0
}
export declare enum ContentTransferEncoding {
    SevenBit = "7bit",
    EightBit = "8bit",
    QuotedPrintable = "quoted-printable",
    Base64 = "base64",
    Binary = "binary"
}
/**
 *      Contains a bitmask of flags that indicate the origin and current state of a message.
 *
 *      See https=//msdn.microsoft.com/en-us/library/cc839733(v=office.15).aspx
 *      This property is a nontransmittable message property exposed at both the sending and receiving ends of a
 *      transmission, with different values depending upon the client application or store provider involved. This property
 *      is initialized by the client or message store provider when a message is created and saved for the first time and
 *      then updated periodically by the message store provider, a transport provider, and the MAPI spooler as the message
 *      is processed and its state changes.
 *      This property exists on a message both before and after submission, and on all copies of the received
 *      message. Although it is not a recipient property, it is exposed differently to each recipient according to whether
 *      it has been read or modified by that recipient.
 */
export declare const enum MessageFlags {
    MSGFLAG_READ = 1,
    MSGFLAG_UNMODIFIED = 2,
    MSGFLAG_SUBMIT = 4,
    MSGFLAG_UNSENT = 8,
    MSGFLAG_HASATTACH = 16,
    MSGFLAG_FROMME = 32,
    MSGFLAG_ASSOCIATED = 64,
    MSGFLAG_RESEND = 128,
    MSGFLAG_NOTIFYREAD = 256,
    MSGFLAG_NOTIFYUNREAD = 512,
    MSGFLAG_EVERREAD = 1024,
    MSGFLAG_ORIGIN_X400 = 4096,
    MSGFLAG_ORIGIN_INTERNET = 8192,
    MSGFLAG_ORIGIN_MISC_EXT = 32768
}
/**
 * Contains a bitmask of flags indicating the operations that are available to the client for the object.
 * See https=//msdn.microsoft.com/en-us/library/office/cc979218.aspx
 * This property is read-only for the client. It must be a bitwise OR of zero or more values from the following table.
 */
export declare const enum MapiAccess {
    MAPI_ACCESS_MODIFY = 1,
    MAPI_ACCESS_READ = 2,
    MAPI_ACCESS_DELETE = 4,
    MAPI_ACCESS_CREATE_HIERARCHY = 8,
    MAPI_ACCESS_CREATE_CONTENTS = 16,
    MAPI_ACCESS_CREATE_ASSOCIATED = 32
}
/**
 * Kind (1 byte)= The possible values for the Kind field are in the following table.
 */
export declare const enum PropertyKind {
    Lid = 0,
    Name = 1,
    NotAssociated = 255
}
