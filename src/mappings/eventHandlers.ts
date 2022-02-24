import { SubstrateEvent, SubstrateExtrinsic } from "@subql/types";
import { AutomationTimeEvent, AutomationTimeExtrinsic } from "../types";

export async function handleAutomationTimeEvent(substrateEvent: SubstrateEvent): Promise<void> {
  const { idx, block, event, extrinsic } = substrateEvent;
  const blockHeight = block.block.header.number;
  let call = null;
  if (typeof extrinsic !== 'undefined') {
    call = await createAutomationTimeExtrinsic(extrinsic);
  }

  const eventAttributes = {
    id: `event-${blockHeight}-${idx}`,
    blockHeight: blockHeight.toBigInt(),
    idx: idx,
    module: event.section,
    event: event.method,
    docs: event.meta.docs.map(String),
    extrinsicId: call,
    timestamp: block.timestamp
  }

  await AutomationTimeEvent.create(eventAttributes).save();
}

async function createAutomationTimeExtrinsic(substrateExtrinsic: SubstrateExtrinsic): Promise<String> {
  const { idx, block, extrinsic } = substrateExtrinsic;
  const blockHeight = block.block.header.number;

  const callAttributes = {
    id: `call-${blockHeight}-${idx}`,
    blockHeight: blockHeight.toBigInt(),
    idx: idx,
    module: extrinsic.method.section,
    call: extrinsic.method.method,
    success: substrateExtrinsic.success,
    timestamp: block.timestamp
  }

  const record = AutomationTimeExtrinsic.create(callAttributes);
  await record.save();
  return record.id;
}