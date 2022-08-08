import { WebClient } from '@slack/web-api';

const accessToken = 'xoxb-3334524827045-3909431169044-X5uooXItTNUlJQlHFQC3pZUM';

// Create a new instance of the WebClient class with the accessToken read from your environment variable
const web = new WebClient(accessToken);
// The current date
const currentTime = new Date().toTimeString();

(async () => {

  try {
    // Use the `chat.postMessage` method to send a message from this app
    await web.chat.postMessage({
      channel: '#general',
      text: `The current time is ${currentTime}`,
    });
    console.log('Message posted!');
  } catch (error) {
    console.log(error);
  }

})();