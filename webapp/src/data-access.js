import { fetchData } from 'dx-react-devextreme-data-server/dist/data-access';

const BASEDATA = '//localhost:3000/data/v1/values';
var BASEAPI = '//localhost:3000/api/v1';

function sendChange(row, add = true, key) {
  console.log(`Sending change with add=${add}, key=${key}: `, row);

  const params = {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    method: add ? 'POST' : 'PUT',
    body: JSON.stringify(row)
  };
  const url = BASEDATA + (add ? '' : `/${key}`);
  fetch(url, params).catch(r =>
    console.log('Something went wrong POSTing this row: ', row)
  );
}

const commitChanges = ({ added, changed, deleted }) => {
  console.log('committing added: ', added);
  console.log('committing changes: ', changed);

  if (added && added.length > 0) for (const row of added) sendChange(row);
  if (changed) for (const key in changed) sendChange(changed[key], false, key);
};

const createTestData = () => {
  fetch(BASEAPI + '/createTestData?count=' + encodeURIComponent(1000));
};

export { fetchData, commitChanges, createTestData };
