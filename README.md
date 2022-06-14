# Waxal Speech Data Resources

## Stats
| Language | Participants | Recordings | Speech hours | Transcribed Hours |
|----------|-----|----|-----|-------------------|
| Wolof    |4242 |86296 | 519          | 5.2                 |
## Goal
Collect/Create NLP resources using crowdsourced speech and text data of diverse African languages and use it to research novel architectures and deep learning algorithms for multilingual NLP systems (Speech, NMT, Q&A, LM, etc.) that are robust to variations in accents, code switching, and targeted at low-end mobile devices. Waxal will make NLP systems more inclusive while advancing the state of the art in deep learning for NLP and machine learning under severe  memory/computing constraints.

## Context
Africa is the most linguistically diverse continent in the world. The performance of SOTA NLP systems is fragile in most African languages compared to the European ones (for example) despite a similar or more significant number of speakers. For example, while the number of Swahili and German language speakers are identical (L1 and L2, about 100M), the latter is far better studied by the research community than the former. Also, even though European languages such as English, French, and Portuguese are official languages in most African countries, the local spoken and written variations can have substantial differences compared to the standard versions of the European languages. The vocabulary and accents are largely influenced by the local languages. Current NLP systems rarely consider such discrepancies. Consequently, significant portions of people are locked out of the opportunities opened by the recent advances in natural language processing and its applications.

## Usage
Data for each language's audio is stored in a different folder. The CSV structure is the same across languages. Download the latest release from [Releases](https://github.com/Waxal-Multilingual/speech-data/releases/tag/Live).

### Audio files
To download the audio files, run `gsutil -m cp -R gs://waxal-public {path/to/local}`. You can then replace `https://storage.googleapis.com/` in the **Audio** field of the **Response** table with your `{path/to/local}`.

### Tables
#### Response
This file contains a table of the responses collected. Each response has a link to a public GCP storage bucket in the **Audio** column.
#### Transcription
This file contians a table of transcriptions of the data from the **Reponse** table.
##### Key Columns 
 - Response: The ID of a response maps to the **Key** field of the **Response** table.
 - Language: The language of the transcribed text in the **Text** column.
 - Text: The transcribed text.
#### Translation
This file contains translations of the text from from the **Transcriptions** table.
##### Key Columns 
 - Response: The ID of a response maps to the **Key** field of the **Response** table.
 - Transcription: Foreign key mapping to the **Key** field in the **Transcriptions** table.
 - Target Language: The language to which the text was transcribed.
 - Text: The tranlsated text.

## Data collection
Audio data was crowdsourced with a chat bot using Whatsapp and Twilio. Transcription and translation was performed by linguists. More details below.

### Methodoloy
#### Speech
The workflow used to collect speech will be shared in an upcoming release. Diagram of the process is shown below
![alt text](https://github.com/Waxal-Multilingual/speech-data/blob/main/docs/flow.png?raw=true)


#### Transcription
// TODO
#### Translation
// TODO
## Participants
// TODO
