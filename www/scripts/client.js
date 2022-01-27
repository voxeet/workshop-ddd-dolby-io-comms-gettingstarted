const avengersNames = ['Thor', 'Cap', 'Tony Stark', 'Black Panther', 'Black Widow', 'Hulk', 'Spider-Man'];
let randomName = avengersNames[Math.floor(Math.random() * avengersNames.length)];

// URL to our token-generator function
const tokenServerURL = './api/token-generator';

const main = async () => {

  /* Event handlers */

  // When a stream is added to the conference
  VoxeetSDK.conference.on('streamAdded', (participant, stream) => {
    if (stream.type === 'ScreenShare') {
      return addScreenShareNode(stream);
    }

    if (stream.getVideoTracks().length) {
      // Only add the video node if there is a video track
      addVideoNode(participant, stream);
    }

    addParticipantNode(participant);
    
  });


  
  // When a stream is updated
  VoxeetSDK.conference.on('streamUpdated', (participant, stream) => {
    
    if (stream.type === 'ScreenShare') return;

    if (stream.getVideoTracks().length) {
      // Only add the video node if there is a video track
      addVideoNode(participant, stream);
    } else {
      removeVideoNode(participant);
    }
  });

  // When a stream is removed from the conference
  VoxeetSDK.conference.on('streamRemoved', (participant, stream) => {
    if (stream.type === 'ScreenShare') {
      return removeScreenShareNode();
    }

    removeVideoNode(participant);
    removeParticipantNode(participant);
  });

  // Please read the documentation at:
  // https://docs.dolby.io/communications-apis/docs/initializing-javascript

  try {
    // Initialize the Voxeet SDK

    let token = await refreshToken();
    await VoxeetSDK.initializeToken(token, refreshToken);

    // Initialize the UI
    initUI();
  } catch (e) {
    alert('Something went wrong : ' + e);
  }
}

main();


/**  Refresh Token is called when token expiration is 50% completed, this keeps the app initialized */
/** We will use a post method to match our serverless function's restriction */
async function refreshToken() {
  return fetch(tokenServerURL, {
    method: 'post'
  })
    .then((res) => {
      return res.json();
    })
    .then((json) => json.access_token)
    .catch((error) => {
      console.error(error);
    });
}
