# Waxal in a box

## Overview

![alt text](https://github.com/Waxal-Multilingual/speech-data/blob/main/docs/flow.png?raw=true)

### Summary

This package contains a JS library that works in conjunction with Twilio to
perform speech data collection using image prompts. The instructions below
detail how to set up your own collection pipeline using the code.

### Before you start

1. Sign up for a [Twilio](https://www.twilio.com/) account.
2. Have available a [Google Cloud](https://console.cloud.google.com/) project
   with the following:
    * A service
      account ([documentation](https://cloud.google.com/iam/docs/creating-managing-service-accounts))
      .
    * A service account key JSON
      file ([documentation](https://cloud.google.com/iam/docs/creating-managing-service-account-keys))
      .
    * A GCP storage
      bucket ([documentation](https://cloud.google.com/storage/docs/creating-buckets))
      with write access granted to the service account
      above ([Instructions here](https://cloud.google.com/storage/docs/access-control/using-iam-permissions))
      .
3. Have way to serve websites. For this overview, we will be
   using [ngrok](https://ngrok.com/).

### Prepare to run your Waxal server

#### Install npm

```console
sudo apt-get install npm
```

#### Check out the code

```console
git clone https://github.com/Waxal-Multilingual/speech-data.git
cd speech-data/collection
npm install
```

#### Set up variables

##### Environment variables (.env)

1. **ACCOUNT_SID=** {Twilio account SID. Can be found in
   the [Twilio Console](https://console.twilio.com/?frameUrl=/console)}
2. **AUTH_TOKEN=** {Twilio auth token. Can be found in
   the [Twilio Console](https://console.twilio.com/?frameUrl=/console)}

#### Flow variables (collection/assets/vars.private.json)

##### Spreadsheets

The following variables are the Google Sheets IDs of documents needed for the
flow (everything after d/ and before the next slash in the document URL). In
each case, the *Key* field must be a unique identifier. Sequential numbers will
suffice. For more information on the data columns, refer to
the [README](https://github.com/Waxal-Multilingual/speech-data/blob/main/README.md)
in the root directory.

**NOTE**: Make sure these sheets are write-able by your robot user created
above.

* **participant-sheet**: Sheet for participant info. You can make a copy
of [this file](https://docs.google.com/spreadsheets/d/14wZIBMKUKySrvyw0xU4CmJpDUVtsUsS7DQxZBmaiBuA/edit#gid=0)
to get started.

* **response-sheet**: Sheet where links to participant response audio files will be stored. You can
make a copy
of [this file](https://docs.google.com/spreadsheets/d/14wZIBMKUKySrvyw0xU4CmJpDUVtsUsS7DQxZBmaiBuA/edit#gid=0)
to get started.

* **prompt-sheet**: Sheet containing URLs of images to be used for prompts. You can make a copy
of [this file](https://docs.google.com/spreadsheets/d/14wZIBMKUKySrvyw0xU4CmJpDUVtsUsS7DQxZBmaiBuA/edit#gid=0)
to get started.

##### Twilio

* **whatsapp-number**: The Twilio Whatsapp
Sandbox [phone number](https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox?frameUrl=%2Fconsole%2Fsms%2Fwhatsapp%2Fsandbox)
.

##### Audio Prompts

The following variables define the URLs of audio prompts which are intended to
provide participants with information about the collection process. The links
present in those fields are for illustration purposes only but can be used for
testing.

* **not-registered-audio**: An audio file explaining to a user that they are not yet registered for the
study and providing instructions about how to get registered.

* **voice-note-required-audio**: Participants must reply to text prompts with voice notes. If they send a message
that doesn't contain audio, this audio will be sent to them.

* **voice-note-too-short-audio**: This audio is sent to participants who reply with a voice note that is shorter
than *min-audio-length-secs*.

* **survey-completed-audio**: This audio is played for a user once they have completed the full set of
questions.

* **consent-audio**: Participants should consent to the usage of their audio before joining the
study. This audio will restate their consent and give them an opportunity to opt
out.

##### Misc

* **storage-bucket**: Then name GCP storage bucket into which audio files will be stored.

* **min-audio-length-secs**: Minimum length of audio responses.

* **language**: The language of data being collected.

### Start up waxal server and set it as the webhook endpoint in Twilio

Your Waxal server will be the endpoint called by Twilio when participants reply
to your prompts. You will need to deploy your server in a publicly accessible
way such that Twilio can make RPCs to it.

#### Starting your server locally

To start a local server run ```npm start``` from ```speech-data/collection```.
Fix any errors that pop up until your server is running. Make note of the
running port (in most cases it should be 3000).

#### Deploying your server with ngrok

Twilio will call your server to process messages from participants. For a quick
way to get hosted on the open web, you can use [ngrok](https://ngrok.com/).
Install ngrok and forward your server port from above.

```console
sudo npm install -g ngrok
ngrok http 3000
```

Once the server is up, copy the public URL logged as *Forwarding* in the
terminal (eg. https://xxx.eu.ngrok.io)

#### Setting the webhook URI in Twilio

Once you have a public server URL, visit
the [Twilio Whatsapp Sandbox](https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox?frameUrl=%2Fconsole%2Fsms%2Fwhatsapp%2Fsandbox)
page and set the *WHEN A MESSAGE COMES IN* field to your full ngrok public URL with the path `/start_flow`. After
this point, you should be ready to test your collection flow. Example below:

```https://xxx.ngrok.io/start_flow```

### Register a participant and start sending prompts

#### Add to the participant sheet

In your participant sheet, create a row for the participant similar to the one
in
the [Demo Participant Sheet](https://docs.google.com/spreadsheets/d/14wZIBMKUKySrvyw0xU4CmJpDUVtsUsS7DQxZBmaiBuA/edit#gid=0)
.

#### Invite to join your Twilio sandbox

Sandbox users must explicitly opt in to start receiving messages. On
the [Whatsapp Sandbox Page](https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox?frameUrl=%2Fconsole%2Fsms%2Fwhatsapp%2Fsandbox)
, look for your sandbox invitation message under the *Sandbox Participants*
section. It should be something like ```join xxx-xxx```.

For convenience, you can create a Whatsapp API URL that will prepolate the
message in the Participant's Whatsapp app. For example, if your code
is ```join waxal-speech```, and your sandbox phone number is ```+14155238886```
you can send them the URL

```
https://wa.me/+14155238886?text=join%waxal-speech
```

Once users send the message, they will officially be enrolled and can start the
process by sending **"hi"** to the bot.

### Finding your data

After each response is received, it is stored in your storage bucket under the
folder ```{promptId}/{participantId}```. A row is also entered in the *Response*
table with a link to the stored file and columns for the participant and prompt.
