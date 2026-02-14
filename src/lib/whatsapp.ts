const WHATSAPP_API_BASE_URL = "https://graph.facebook.com/v21.0";

class WhatsAppService {
  private apiToken: string;
  private phoneNumberId: string;

  constructor() {
    const apiToken = process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!apiToken) {
      throw new Error("WHATSAPP_API_TOKEN environment variable is not set");
    }

    if (!phoneNumberId) {
      throw new Error(
        "WHATSAPP_PHONE_NUMBER_ID environment variable is not set"
      );
    }

    this.apiToken = apiToken;
    this.phoneNumberId = phoneNumberId;
  }

  /**
   * Send a text message to a WhatsApp number.
   */
  async sendMessage(to: string, message: string): Promise<{ messageId: string }> {
    const url = `${WHATSAPP_API_BASE_URL}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `WhatsApp API error (${response.status}): ${
          errorData ? JSON.stringify(errorData) : response.statusText
        }`
      );
    }

    const data = await response.json();
    return { messageId: data.messages?.[0]?.id ?? "" };
  }

  /**
   * Send a template message to a WhatsApp number.
   */
  async sendTemplate(
    to: string,
    templateName: string,
    params: string[]
  ): Promise<{ messageId: string }> {
    const url = `${WHATSAPP_API_BASE_URL}/${this.phoneNumberId}/messages`;

    const components =
      params.length > 0
        ? [
            {
              type: "body",
              parameters: params.map((param) => ({
                type: "text",
                text: param,
              })),
            },
          ]
        : [];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "pt_BR",
          },
          components,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `WhatsApp API error (${response.status}): ${
          errorData ? JSON.stringify(errorData) : response.statusText
        }`
      );
    }

    const data = await response.json();
    return { messageId: data.messages?.[0]?.id ?? "" };
  }

  /**
   * Mark a message as read.
   */
  async markAsRead(messageId: string): Promise<void> {
    const url = `${WHATSAPP_API_BASE_URL}/${this.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `WhatsApp API error (${response.status}): ${
          errorData ? JSON.stringify(errorData) : response.statusText
        }`
      );
    }
  }
}

// Singleton instance — lazily created to avoid throwing on import
// when environment variables are not yet loaded.
let instance: WhatsAppService | null = null;

export function getWhatsAppService(): WhatsAppService {
  if (!instance) {
    instance = new WhatsAppService();
  }
  return instance;
}

export { WhatsAppService };
