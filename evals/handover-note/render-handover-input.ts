export type HandoverInput = {
  ticket_thread: string;
  order_record: unknown;
  reply_assist: unknown;
};

export function renderHandoverInput(input: HandoverInput): string {
  return `
<ticket_thread>
${input.ticket_thread}
</ticket_thread>

<order_record>
${JSON.stringify(input.order_record, null, 2)}
</order_record>

<reply_assist>
${JSON.stringify(input.reply_assist, null, 2)}
</reply_assist>
`.trim();
}