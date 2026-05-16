import axios from 'axios';

async function checkApi() {
  try {
    // Need a valid token. Let's just login as the president from the db script.
    // Wait, I can't login without the password.
    console.log("Cannot easily curl without auth token.");
  } catch (err) {
    console.error(err);
  }
}
checkApi();
