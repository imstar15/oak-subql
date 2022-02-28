import { SubstrateEvent, SubstrateExtrinsic } from "@subql/types";
import { BaseEvent, BaseExtrinsic } from "../types";

export async function handleEvent(substrateEvent: SubstrateEvent): Promise<void> {
  const { idx, block, event, extrinsic } = substrateEvent;
  const blockHeight = block.block.header.number;

  let callId = null;
  if (typeof extrinsic !== 'undefined') {
    const { section: extrinsicModule, method: extrinsicMethod } = extrinsic.extrinsic.method;
    // Skip indexing events for mandatory system extrinsics
    if ((extrinsicModule === 'parachainSystem' && extrinsicMethod === 'setValidationData') ||
      (extrinsicModule === 'timestamp' && extrinsicMethod === 'set')) {
      return;
    }

    callId = await findOrCreateExtrinsic(extrinsic);
  }

  const eventAttributes = {
    id: `event-${blockHeight}-${idx}`,
    blockHeight: blockHeight.toBigInt(),
    idx: idx,
    module: event.section,
    method: event.method,
    data: event.data.toJSON(),
    docs: event.meta.docs.join(" "),
    extrinsicId: callId,
    timestamp: block.timestamp,
  }

  await BaseEvent.create(eventAttributes).save();
}

async function findOrCreateExtrinsic(substrateExtrinsic: SubstrateExtrinsic): Promise<String> {
  const { idx, block, extrinsic } = substrateExtrinsic;
  const blockHeight = block.block.header.number;
  const id = `extrinsic-${blockHeight}-${idx}`;

  const existingBaseExtrinsic = await BaseExtrinsic.get(id)
  if (typeof existingBaseExtrinsic !== 'undefined') {
    return existingBaseExtrinsic.id;
  }

  const { args } = extrinsic.method.toJSON();

  const callAttributes = {
    id: id,
    blockHeight: blockHeight.toBigInt(),
    idx: idx,
    module: extrinsic.method.section,
    method: extrinsic.method.method,
    success: substrateExtrinsic.success,
    args: args,
    timestamp: block.timestamp
  }

  const record = BaseExtrinsic.create(callAttributes);
  await record.save();
  return record.id;
}