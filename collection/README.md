# Waxal in a box

## Overview

<figure>
<img src="https://github.com/Waxal-Multilingual/speech-data/blob/main/docs/flow.png?raw=true" alt="Waxal flow diagram">
<figcaption align = "center"><b>Waxal flow diagram</b></figcaption>
</figure>

### Summary

This package contains a JS library that works in conjunction with Twilio to
perform speech data collection using image/text/audio prompts. The instructions below
detail how to set up your own collection pipeline using the code.

## Before you start

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

## Prepare to run your Waxal server

### Install npm

```console
sudo apt-get install npm
```

### Check out the code

```console
git clone https://github.com/Waxal-Multilingual/speech-data.git
cd speech-data/collection
npm install
```

### Set up variables

#### Environment variables (.env)

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

* **response-sheet**: Sheet where links to participant response audio files will
  be stored. You can make a copy
  of [this file](https://docs.google.com/spreadsheets/d/1Zb5eifySYaQ9eDdmOC133bo1Ut8FgfzxNQZL4m9gjB8/edit#gid=0)
  to get started.

* **prompt-sheet**: Sheet containing prompts. A prompt can be text, image or audio, depending on which column you
  populate. You
  can make a copy
  of [this file](https://docs.google.com/spreadsheets/d/1468gA4cFf74-YuH9cXMbWRcHpZFFfP3z27e_NyjB0Bk/edit#gid=0)
  to get started.

* **transcription-sheet**: Sheet where transcriptions will be stored. You can
  make a copy
  of [this file](https://docs.google.com/spreadsheets/d/1MKzliEHKdHNJ00pwaObyhhTOGP7rMJN8QJOnQxgCMxk/edit#gid=0)
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

* **not-registered-audio**: An audio file explaining to a user that they are not
  yet registered for the study and providing instructions about how to get
  registered.

* **voice-note-required-audio**: Participants must reply to text prompts with
  voice notes. If they send a message that doesn't contain audio, this audio
  will be sent to them.

* **voice-note-too-short-audio**: This audio is sent to participants who reply
  with a voice note that is shorter than *min-audio-length-secs*.

* **survey-completed-audio**: This audio is played for a user once they have
  completed the full set of questions.

* **consent-audio**: Participants should consent to the usage of their audio
  before joining the study. This audio will restate their consent and give them
  an opportunity to opt out.

* **error-message-audio**: This audio is played for a user if there is a server error (eg. Quota issue). Users should be
  able to continue from where they left off once the error is resolved.

##### Misc

* **storage-bucket**: Then name GCP storage bucket into which audio files will
  be stored.

* **min-audio-length-secs**: Minimum length of audio responses.

* **transcriptions-per-response**: Number of transcriptions per response (per
  language).

* **speech-language**: The language of speech data being collected. Currently,
  speech samples can only be collected for a single language per Waxal server.

* **transcription-language**: The language of transcription data being
  collected. Currently, transcription can only be done in 1 language at a time
  per Waxal server.

* **transcription-instructions**: Text instructions written in *
  transcription-language* instructing users to transcribe received audio.

## Run the Waxal Server

Your Waxal server will be the endpoint called by Twilio when participants reply
to your prompts. You will need to deploy your server in a publicly accessible
way such that Twilio can make RPCs to it. You can either deploy locally with
Twilio's built in [ngrok](https://ngrok.com/) server or deploy directly to the
Twilio server.

### Test your server locally

To start a local server run ```npm start``` from ```speech-data/collection```.
A sanity check will run to verify that the preliminary steps have all been completed and that your sheets have been set up correctly.
Fix any errors that pop up until your server is running. Once the server is up,
take note of the URL of the `start_flow` function. Example below:

```https://xxx.ngrok.io/start_flow```

### Deploy your server to Twilio

To deploy your server to Twilio, run ```npm run deploy```. Take note of the URL
of the `start_flow` function. Example below:

```https://xxx-prod.twil.io/start_flow```

### Set the webhook URI in Twilio

Once you have a public server URL of the `start_flow` function, visit
the [Twilio Whatsapp Sandbox](https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox?frameUrl=%2Fconsole%2Fsms%2Fwhatsapp%2Fsandbox)
page and set the *WHEN A MESSAGE COMES IN* field to that URL. After this point,
you should be ready to test your collection flow.

## Run a data collection study

### Prepare your prompts

Waxal can be used to send text, image or audio prompts. You can find a selection of over 2000 image prompts
in [this file](https://docs.google.com/spreadsheets/d/1wlItYWGXu3GtHWfQD8m8_FcUVqWsCzINPkwDB5fkExs/edit#gid=1031689018).
For your own study, you can set the *Image* *Audio* or *Text* column for each prompt accordingly. Setting more than 1 column is not supported.

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
https://wa.me/+14155238886?text=join%20waxal-speech
```

Once users send the message, they will officially be enrolled and can start the
process by sending **"hi"** to the bot.

<figure>
   <img src="https://github.com/Waxal-Multilingual/speech-data/blob/main/docs/image_prompt.png?raw=true" alt="Example image prompt" style="width:200px;"/>
   <figcaption align = "center"><b>Example image prompt</b></figcaption>
</figure>

#### Automate user registration

In a live study, you may want to automatically register users once they have
completed the consent form. To see an example of this, take a look at
the [example form](https://docs.google.com/forms/d/1V7qz6agNkI4zOAQxksi7mMdFFTIy0lTWBGfRvTSbUw8/edit)
and [Apps Script Trigger](https://script.google.com/home/projects/18Bj3X4FranYU-ug4dfvfgLDqU6X8axWZythDT29gW8sBRfVd3krmJiDV/edit)
.

This form installs a submit trigger that adds participants to the Particpant
sheet and also provides a shortcut to pre-populate the sandbox registration
Whatsapp message. Feel free to make a copy of the form for your study.

The 2 key parts of the form to update are:

1. Setting the correct participant sheet ID on line 13 of
   the [trigger](https://script.google.com/home/projects/18Bj3X4FranYU-ug4dfvfgLDqU6X8axWZythDT29gW8sBRfVd3krmJiDV/edit):

```
var sheet = SpreadsheetApp.openById("[your_participant_sheet_id]").getSheetByName("Participant")
```

2. Setting a confirmation message that provides the correct sandbox registration
   message template (
   Under [Settings](https://docs.google.com/forms/d/1V7qz6agNkI4zOAQxksi7mMdFFTIy0lTWBGfRvTSbUw8/edit#settings)
   -> Presentation -> Confirmation Message)

```
Your consent has been recorded. Please follow the following link on your phone to register: https://wa.me/+14155238886?text=join%20[your_sandbox_code]
```

### Find your audio data

After each response is received, it is stored in your storage bucket under the
folder ```{promptId}/{participantId}```. A row is also entered in the *Response*
table with a link to the stored file and columns for the participant and prompt.

### Collect transcriptions of your audio data

Once you have concluded the speech collection phase of your study, you can use
Waxal to crowd-source transcriptions via Whatsapp. To add a transcriber, simply
set their *Type* column to **"Transcriber".**

In this case, the audio files from the *Response* sheet will be sent to *Transcriber* participants in a uniformly distributed fashion. Text transcription responses will be written to the *transcription-sheet*
file ([example](https://docs.google.com/spreadsheets/d/1MKzliEHKdHNJ00pwaObyhhTOGP7rMJN8QJOnQxgCMxk/edit#gid=0))
.

<figure>
   <img src="https://github.com/Waxal-Multilingual/speech-data/blob/main/docs/audio_prompt.png?raw=true" alt="Example image prompt" style="width:300px; float: right"/>
   <figcaption align = "center"><b>Example transcription prompt</b></figcaption>
</figure>

## Use the Waxal Manager app to transcribe and translate


[Waxal Manager](https://www.appsheet.com/Template/AppDef?appName=WaxalManager-4528453-22-06-26)
is an example [AppSheet](https://www.appsheet.com/) app that can be used to
manage your data collection process. You can clone the app and point to your
project's spreadsheets to use it. The app provides views for managing prompts,
participants, responses, transcriptions and translations.

<figure>
   <img src="https://github.com/Waxal-Multilingual/speech-data/blob/main/docs/manager.png?raw=true" style="width: 500px">
   <figcaption align = "center"><b>Waxal Manager App</b></figcaption>
</figure>
