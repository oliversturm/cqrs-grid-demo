const BATCH_SAVE = 'BATCH_SAVE';
const BATCH_DISCARD = 'BATCH_DISCARD';

const batchSave = () => ({
  type: BATCH_SAVE
});

const batchDiscard = () => ({
  type: BATCH_DISCARD
});

export { batchSave, batchDiscard, BATCH_SAVE, BATCH_DISCARD };
