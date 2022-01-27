
const initUI = async () => {
  // const nameMessage = document.getElementById('name-message');
  const nameInput = document.getElementById('name-input');
  const joinButton = document.getElementById('join-btn');
  const conferenceAliasInput = document.getElementById('alias-input');
  const leaveButton = document.getElementById('leave-btn');
  const lblDolbyVoice = document.getElementById('label-dolby-voice');
  const startVideoBtn = document.getElementById('start-video-btn');
  const stopVideoBtn = document.getElementById('stop-video-btn');
  const startAudioBtn = document.getElementById('start-audio-btn');
  const stopAudioBtn = document.getElementById('stop-audio-btn');
  const startScreenShareBtn = document.getElementById('start-screenshare-btn');
  const stopScreenShareBtn = document.getElementById('stop-screenshare-btn');
  const startRecordingBtn = document.getElementById('start-recording-btn');
  const stopRecordingBtn = document.getElementById('stop-recording-btn');


  const navSettings = document.getElementById('nav-settings');
  navSettings.style.display = "none"; // show with block 

  const dolbyVoiceBtn = document.getElementById('dolby-voice-btn');

  setVideoDeviceBtn = document.getElementById("set-video-device-btn");
  setInputAudioDeviceBtn = document.getElementById("set-input-audio-device-btn");
  setOutputAudioDeviceBtn = document.getElementById("set-output-audio-device-btn");
  videoDevices = document.getElementById("video-devices");
  inputAudioDevices = document.getElementById("input-audio-devices");
  outputAudioDevices = document.getElementById("output-audio-devices");

  setVideoDeviceBtn.disabled = true;
  setInputAudioDeviceBtn.disabled = true;
  setOutputAudioDeviceBtn.disabled = true;

  leaveButton.disabled = true;

  let audioOn = false;
  let videoOn = true;
  let useDolbyVoice = true;


  dolbyVoiceBtn.onclick = async () => {
    if (dolbyVoiceBtn.checked == true) {
      useDolbyVoice = true;
    } else {
      useDolbyVoice = false;
    }
    lblDolbyVoice.innerHTML = `Dolby Voice ${useDolbyVoice ? 'On' : 'Off'}`;
  }



  // Update the login message with the name of the user
  nameInput.value = randomName;
  joinButton.disabled = false;


  // device selection
  setVideoDeviceBtn.onclick = async () => {
    let selectedVideoDevice = videoDevices.options[videoDevices.selectedIndex];
    alert(`You're video device has been set to: ${selectedVideoDevice.text}`);
    await VoxeetSDK.mediaDevice.selectVideoInput(selectedVideoDevice.value);
  }

  setInputAudioDeviceBtn.onclick = async () => {
    let selectedInputAudioDevice = inputAudioDevices.options[inputAudioDevices.selectedIndex];
    alert(`You're input audio device (mic) has been set to: ${selectedInputAudioDevice.text}`)
    await VoxeetSDK.mediaDevice.selectAudioInput(selectedInputAudioDevice.value);
  }

  setOutputAudioDeviceBtn.onclick = async () => {
    let selectedOutputAudioDevice = outputAudioDevices.options[outputAudioDevices.selectedIndex];
    alert(`You're output audio device (speaker) has been set to: ${selectedOutputAudioDevice.text}`)
    await VoxeetSDK.mediaDevice.selectAudioOutput(selectedOutputAudioDevice.value);
  }

 

  joinButton.onclick = async () => {
    // open a session with participant object
    await VoxeetSDK.session.open({ name: nameInput.value  }).catch((err) => console.error(err));

    // Default conference parameters
    // See: https://docs.dolby.io/communications-apis/docs/js-client-sdk-model-conferenceparameters
    let conferenceParams = {
      liveRecording: true,
      rtcpMode: "average", // worst, average, max
      ttl: 0,
      videoCodec: "H264", // H264, VP8
      dolbyVoice: useDolbyVoice
    };

    // See: https://docs.dolby.io/interactivity/docs/js-client-sdk-model-conferenceoptions
    let conferenceOptions = {
      alias: conferenceAliasInput.value,
      params: conferenceParams
    };

    // 1. Create a conference room with an alias
    VoxeetSDK.conference.create(conferenceOptions)
      .then((conference) => {
        // See: https://docs.dolby.io/interactivity/docs/js-client-sdk-model-joinoptions
        const joinOptions = {
          constraints: {
            audio: audioOn,
            video: true
          },
          preferRecvMono: false,
          preferSendMono: false,
          spatialAudio: true // Turn on Spatial Audio
        };


        // 2. Join the conference
        VoxeetSDK.conference.join(conference, joinOptions)
          .then((conf) => {
            //update ui
            nameInput.disabled = true;
            lblDolbyVoice.innerHTML = `Dolby Voice ${conf.params.dolbyVoice ? 'On' : 'Off'}`;
            useDolbyVoice = conf.params.dolbyVoice;
            dolbyVoiceBtn.checked = useDolbyVoice;
            conferenceAliasInput.disabled = true;
            joinButton.disabled = true;
            leaveButton.disabled = false;
            startVideoBtn.disabled = true;
            startAudioBtn.disabled = false;
            stopAudioBtn.disabled = true;
            stopVideoBtn.disabled = false;
            startScreenShareBtn.disabled = false;
            startRecordingBtn.disabled = false;
            setVideoDeviceBtn.disabled = false;
            setInputAudioDeviceBtn.disabled = false;
            setOutputAudioDeviceBtn.disabled = false;
            navSettings.style.display = "block"; // block 

            // Populate All Device options once  
            if (videoDevices.options.length == 0) {
              enumerateMediaDevices();
            }
          
          })
          .catch((err) => console.error(err));
      })
      .catch((err) => console.error(err));
  };


  leaveButton.onclick = async () => {
    // Leave the conference
    VoxeetSDK.conference.leave()
      .then(() => {
        lblDolbyVoice.innerHTML = `Dolby Voice ${useDolbyVoice ? 'On' : 'Off'}`;
        dolbyVoiceBtn.checked = useDolbyVoice;
        conferenceAliasInput.disabled = false;
        joinButton.disabled = false;
        leaveButton.disabled = true;
        startVideoBtn.disabled = true;
        stopVideoBtn.disabled = true;
        startAudioBtn.disabled = true;
        stopAudioBtn.disabled = true;
        startScreenShareBtn.disabled = true;
        stopScreenShareBtn.disabled = true;
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = true;

        // See Docs:  https://docs.dolby.io/communications-apis/docs/initializing-javascript#open-a-session
        // close the session
      VoxeetSDK.session.close().then(() => {
        nameInput.disabled = false;
        }).catch((err) => console.error(err));
      })
      .catch((err) => console.error(err));
  };

  // Determine and update UI based on who is speaking
  const beginIsSpeaking = () => {

    // check if the current session participant is speaking every 5 milliseconds
    setInterval(() => {

      
      let participants = VoxeetSDK.conference.participants;

      for (let participant of participants) {
        VoxeetSDK.conference.isSpeaking(
          VoxeetSDK.conference.participants.get(participant[0]),
          (isSpeaking) => {
            console.log('The participant', participant[0], 'speaking status:', isSpeaking);
            // get card body
            if(document.getElementById(`video-${participant[0]}`) == undefined) { return };

            let card = document.getElementById(`video-${participant[0]}`).parentElement;
            if (isSpeaking) {
              // participant is speaking, update UI accordingly by adding class
              card.classList.remove('video-card-body');
              card.classList.add('video-card-body-isspeaking');
            } else if (!isSpeaking) {
              card.classList.remove('video-card-body-isspeaking')
              card.classList.add('video-card-body')
            }
          }
        );
      }
    }, 500);
  }


  startVideoBtn.onclick = async () => {
    // Start sharing the video with the other participants
    VoxeetSDK.conference.startVideo(VoxeetSDK.session.participant)
      .then(() => {
        startVideoBtn.disabled = true;
        stopVideoBtn.disabled = false;
      })
      .catch((err) => console.error(err));

  };



  stopVideoBtn.onclick = async () => {
    // Stop sharing the video with the other participants
    VoxeetSDK.conference.stopVideo(VoxeetSDK.session.participant)
      .then(() => {
        stopVideoBtn.disabled = true;
        startVideoBtn.disabled = false;
      })
      .catch((err) => console.error(err));
  };

  startAudioBtn.onclick = async () => {
    // Start sharing the Audio with the other participants
    VoxeetSDK.conference.startAudio(VoxeetSDK.session.participant)
      .then(() => {
        startAudioBtn.disabled = true;
        stopAudioBtn.disabled = false;
        beginIsSpeaking();
      })
      .catch((err) => console.error(err));
  };

  stopAudioBtn.onclick = async () => {
    // Stop sharing the Audio with the other participants
    VoxeetSDK.conference.stopAudio(VoxeetSDK.session.participant)
      .then(() => {
        stopAudioBtn.disabled = true;
        startAudioBtn.disabled = false;
      })
      .catch((err) => console.error(err));
  };

  startScreenShareBtn.onclick = async () => {
    // Start the Screen Sharing with the other participants
    VoxeetSDK.conference.startScreenShare()
      .then(() => {
        startScreenShareBtn.disabled = true;
        stopScreenShareBtn.disabled = false;
      })
      .catch((err) => console.error(err));
  };

  stopScreenShareBtn.onclick = async () => {
    // Stop the Screen Sharing
    VoxeetSDK.conference.stopScreenShare()
      .catch((err) => console.error(err));
  };

  startRecordingBtn.onclick = async () => {
    let recordStatus = document.getElementById('record-status');

    // Start recording the conference
    VoxeetSDK.recording.start()
      .then(() => {
        recordStatus.innerText = 'Recording...';
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
      })
      .catch((err) => console.error(err));
  };




  stopRecordingBtn.onclick = async () => {
    let recordStatus = document.getElementById('record-status');

    // Stop recording the conference
    VoxeetSDK.recording.stop()
      .then(() => {
        recordStatus.innerText = '';
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
      })
      .catch((err) => console.error(err));
  };

  // enumerate the devices
  const enumerateMediaDevices = async () => {
    // Load the Output Audio devices
    VoxeetSDK.mediaDevice.enumerateAudioDevices("output")
      .then(devices => {
        devices.forEach(device => {
          outputAudioDevices.append(new Option(device.label, device.deviceId));
        });

        setOutputAudioDeviceBtn.disabled = false;
      })
      .catch(err => console.error(err));

    // Load the Input Audio devices
    VoxeetSDK.mediaDevice.enumerateAudioDevices("input")
      .then(devices => {
        devices.forEach(device => {
          inputAudioDevices.append(new Option(device.label, device.deviceId));
        });
        setInputAudioDeviceBtn.disabled = false;
      })
      .catch(err => console.error(err));

    // Load the Video devices
    VoxeetSDK.mediaDevice.enumerateVideoDevices("input")
      .then(devices => {
        devices.forEach(device => {
          videoDevices.append(new Option(device.label, device.deviceId));
        });

        setVideoDeviceBtn.disabled = false;
      })
      .catch(err => console.error(err));
  }

  // end UIInit
};


// Add a video stream to the web page
const addVideoNode = (participant, stream) => {
  let videoNode = document.getElementById('video-' + participant.id);
  // let cardNode = videoNode.parentElement.parentElement;
  // console.log(cardNode);

  if (!videoNode) {
    const videoContainer = document.getElementById('video-container');
    let cardNode = buildVideoNode(participant.info.name, participant.id);
    videoNode = document.createElement('video');
    videoNode.setAttribute('id', 'video-' + participant.id);

    // add css class to mirror current user's video
    if (participant.id === VoxeetSDK.session.participant.id) {
      videoNode.classList.add('flipped-video');
    } else {
      videoNode.classList.remove('flipped-video');
    }

    videoNode.setAttribute('height', '100%');
    videoNode.setAttribute('width', '100%');
    videoNode.setAttribute("playsinline", true);
    videoNode.muted = true;
    videoNode.setAttribute("autoplay", 'autoplay');

    // insert the video card
    videoContainer.insertAdjacentHTML('beforeend', cardNode);
    // update the video element in the video card with our videoNode
    document.getElementById('video-card-body-' + participant.id).firstElementChild.replaceWith(videoNode);

    // add event handlers for mute / unmute buttons
    addMuteListeners()
  }
  navigator.attachMediaStream(videoNode, stream);
};

// Remove the video streem from the web page
const removeVideoNode = (participant) => {
  let videoNode = document.getElementById('video-' + participant.id);
  if (videoNode) {
     // traverse up parentNode to find cardNode element
    let cardNode = videoNode.parentElement.parentElement.parentElement;
    videoNode.srcObject = null; // Prevent memory leak in Chrome
    cardNode.parentNode.removeChild(cardNode);
    // add update event handlers for mute / unmute buttons
    // updateMuteListeners()
  }
};

// Add a new participant to the list
const addParticipantNode = (participant) => {
  // If the participant is the current session user, don't add them to the list
  if (participant.id === VoxeetSDK.session.participant.id) return;

  let participantNode = document.createElement('li');
  participantNode.setAttribute('id', 'participant-' + participant.id);
  participantNode.setAttribute('class', 'list-group-item')
  participantNode.innerText = `${participant.info.name}`;

  const participantsList = document.getElementById('participants-list');
  participantsList.appendChild(participantNode);
};

// Remove a participant from the list
const removeParticipantNode = (participant) => {
  let participantNode = document.getElementById('participant-' + participant.id);

  if (participantNode) {
    participantNode.parentNode.removeChild(participantNode);
  }
};

// Add a screen share stream to the web page
const addScreenShareNode = (stream) => {
  let screenShareNode = document.getElementById('screenshare');

  if (screenShareNode) {
    return alert('There is already a participant sharing a screen!');
  }

  screenShareNode = document.createElement('video');
  screenShareNode.setAttribute('id', 'screenshare');
  screenShareNode.classList.add('w-75');
  screenShareNode.autoplay = 'autoplay';
  screenShareNode.setAttribute('controls', true);
  navigator.attachMediaStream(screenShareNode, stream);
 
  const screenShareContainer = document.getElementById('screenshare-container');
  screenShareContainer.appendChild(screenShareNode);
}

// Remove the screen share stream from the web page
const removeScreenShareNode = () => {
  let screenShareNode = document.getElementById('screenshare');

  if (screenShareNode) {
    screenShareNode.srcObject = null; // Prevent memory leak in Chrome
    screenShareNode.parentNode.removeChild(screenShareNode);
  }

  const startScreenShareBtn = document.getElementById('start-screenshare-btn');
  startScreenShareBtn.disabled = false;

  const stopScreenShareBtn = document.getElementById('stop-screenshare-btn');
  stopScreenShareBtn.disabled = true;
}

// Utilities

// Build  video card node via a template
const buildVideoNode = (name, id) => {
  let cardID = 'video-card-' + id;
  let cardBodyID = 'video-card-body-' + id;
  let videoID = 'video-' + id;

  let node = `       
  <div id="${cardID}"  class="col.12 col-sm-4">
  <div class="card d-xl-flex flex-shrink-1 justify-content-xl-center align-items-xl-center" 
  style="margin: 6px;margin-top: 5px;margin-right: 5px;margin-bottom: 5px;margin-left: 5px;">
      <div id="${cardBodyID}" class="card-body text-sm-center text-capitalize text-center text-white-50 video-card-body">
   <video id="${videoID}" class="video-player" width="100%" height="100%" autoplay="" playsinline="true" muted style="width: 100%;height: 100%;">
      </video>
          <h4 class="text-center card-title">${name}</h4>
          <div class="mic" style="width=16px; height=16px;"></div>
          <div class="btn-toolbar text-sm-center d-xl-flex d-xxl-flex justify-content-xl-end align-items-xl-center justify-content-xxl-end align-items-xxl-center">
             
          <div role="group" class="btn-group btn-group-sm">
                <button data-participant="${id}" class="unmute btn btn-info btn-sm" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 16 16">
                  <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/>
                  <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                  </svg>
                </button>
                <button data-participant="${id}" class="mute btn btn-info btn-sm" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-mute-fill" viewBox="0 0 16 16">
                  <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z"/>
                  <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z"/>
                  </svg>
              </button>
          </div>
          </div>
      </div>
  </div>
  </div>`
  return node;
}

// dynamically add event listeners as video cards are added to dom.
const addMuteListeners = () => {

  document.querySelectorAll(['.unmute', '.mute']).forEach(ele => {

    ele.onclick = () => {
      let participant = VoxeetSDK.conference.participants.get(ele.dataset.participant);

      if (ele.matches('.unmute')) {
        VoxeetSDK.conference.mute(participant, false);
        console.log(`${participant.info.name} is muted `, VoxeetSDK.conference.isMuted());
      } else {
        VoxeetSDK.conference.mute(participant, true);
        console.log(`${participant.info.name} is muted `, VoxeetSDK.conference.isMuted());
      }
    }
  });
}

// remove listeners
const updateMuteListeners = () => {
  document.querySelectorAll(['.unmute', '.mute']).forEach(ele => {
    ele.onclick = '';
  });
  addMuteListeners();
}
