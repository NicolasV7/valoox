export interface Connection {
  user: string;
  room: string;
  name: string;
  gen: string;
  lang: 'en' | 'es';
  ok: boolean;
  said?: string;
}

export interface Message {
  content: string;
  components?: Array<{
    type: 1;
    components: Array<{ type: 2; style: 5; label: string; url: string }>;
  }>;
}

export interface DiscordOutbox {
  uid: string;
  channel: 'discord';
  to: string;
  room: string;
  gen: string;
  message: Message;
  until: number;
}

export interface Interaction {
  id?: string;
  type?: number;
  application_id?: string;
  context?: number;
  channel_id?: string;
  guild_id?: string;
  locale?: string;
  user?: { id?: string; username?: string; global_name?: string; bot?: boolean };
  data?: { name?: string; options?: Array<{ name?: string; value?: unknown }> };
}
