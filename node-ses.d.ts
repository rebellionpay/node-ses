declare module "node-ses" {
  export type Emails = string | string[];
  export interface MessageTag {
    name: string;
    value: any;
  }
  export interface sendEmailOptions {
    from: string;
    subject: string;
    message: string;
    altText?: string;
    to?: Emails;
    cc?: Emails;
    bcc?: Emails;
    replyTo?: string;
    configurationSet?: string;
    messageTags?: MessageTag[];
    key?: string;
    secret?: string;
    amazon?: string;
  }
  export interface sendRawEmailOptions {
    from: string;
    rawMessage: string;
  }
  export interface Client {
    asyncSendEmail(options: sendEmailOptions): Promise<string>;
    asyncSendRawEmail(options: sendRawEmailOptions): Promise<string>;
  }
  export function createClient({
    key,
    secret,
    amazon
  }: {
    key: string;
    secret: string;
    amazon?: string;
  }): Client;
}
