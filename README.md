# CRM-Migration

This repo uses the data exported following the running of Write Docs with linked object to Google Sheet repo. First, in the sheet Docs_with_Linked_Objects, the customer will need to fill in the corresponding New CRM Provider, New Entity & New Entity ID columns.

## Prerequisites:

### Setting up OAuth 2.0 using Google:

Go to the [Google Cloud Platform Console](https://console.cloud.google.com/) From the projects list, select the project you used previously.

Open _Credentials_ from the console left side menu:

- Click _New Credentials_, then select OAuth client ID.
- Select Web Application and give the App a name.
- Add an authorised redirect URI as: 'http://localhost' and create the Credentials.
- After being redirected, download the JSON file of your OAuth client.

### Fork & Clone this Repo

[Bring the code](https://docs.github.com/en/get-started/quickstart/fork-a-repo) into a directory.

### NPM Modules

- Install [Node](https://nodejs.org/en/) or make sure that you're running v16+
- Navigate to the directory where you cloned the repo on your terminal.
- In your terminal you can run 'npm install' to create your node_modules folder with all the script dependecies. But below is a list of all the used packages:

  - [Dotenv](https://www.npmjs.com/package/dotenv)
  - [Google APIs](https://www.npmjs.com/package/googleapis)
  - [Axios](https://www.npmjs.com/package/axios)
  - [readline-promise](https://www.npmjs.com/package/readline-promise)
  - [agentkeepalive](https://www.npmjs.com/package/agentkeepalive)

### Add Files

To the root directory you will need to add a .env File. You can copy and paste the contents of the .envSample file and fill in the PandaDoc Access token.

In the Credentials Folder you will need to add 3 files: ‘credentials.json’, ‘refresh.json’, ‘token.json’. Both the refresh.json & the token.json files can be left empty. However, in your credentials.json file you will need to copy and paste the contents of the Google OAuth Client file which you downloaded earlier. There is a credentialsSample.json file so you can check that it is correct, obviously yours will have data.

## Run the Script

In your terminal make sure you are in the correct Directory and run:

```bash
node index.js
```

You will be asked to authorise the app by visiting a URL, copy and paste this into your browser and allow the Google Permissions. This will redirect you to a blank page, however in the URL there will be a Code which you can copy and then paste back into your terminal.

If this is successful, the application will write your credentials into your token.json and refresh.json files.

You can now chill while this runs.
