import { SubstrateEvent, SubstrateExtrinsic } from "@subql/types";
import { Event } from "../types/models/Event";
import { Extrinsic } from "../types/models/Extrinsic";

export async function handleEvent(substrateEvent: SubstrateEvent): Promise<void> {
  const { idx, block, event, extrinsic } = substrateEvent;
  const blockHeight = block.block.header.number;
  let callId = null;
  if (typeof extrinsic !== 'undefined') {
    callId = await createExtrinsic(extrinsic);
  }

  const eventAttributes = {
    id: `event-${blockHeight}-${idx}`,
    blockHeight: blockHeight.toBigInt(),
    idx: idx,
    module: event.section,
    event: event.method,
    docs: event.meta.docs.map(String),
    extrinsicId: callId,
    timestamp: block.timestamp
  }

  await Event.create(eventAttributes).save();
}

async function createExtrinsic(substrateExtrinsic: SubstrateExtrinsic): Promise<String> {
  const { idx, block, extrinsic } = substrateExtrinsic;
  const blockHeight = block.block.header.number;

  const { args } = JSON.parse(JSON.stringify(extrinsic.method.toHuman(true)));

  const callAttributes = {
    id: `call-${blockHeight}-${idx}`,
    blockHeight: blockHeight.toBigInt(),
    idx: idx,
    module: extrinsic.method.section,
    call: extrinsic.method.method,
    success: substrateExtrinsic.success,
    args: args,
    timestamp: block.timestamp
  }

  const record = Extrinsic.create(callAttributes);
  await record.save();
  return record.id;
}