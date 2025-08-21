
* As a user, I want that when I visit the youtube's homepage, the videos that belong to the topics I have entered in the exclude list, do not appear in my screen.

Step 1: Create a function that takes two texts, one is the topic and second is the video title and calculate cosine similarity. Write unit tests for this function. Use paraphrase-multilingual-MiniLM-L12-v2 from huggingface model for embeddings. 
Relevant markers in the DOM of youtube homepage
    <div id="contents"> contains all the videos
    <div id="content"> contans one video element
    <h3> with class="yt-lockup-metadata-view-model-wiz__heading-reset", under 'title' property
Step 2: For each video, get the title, calculate cosine similarity with each of the topics, and if the cosine similarity is greater than the threshold of any, disable the element by making opacity 25% and pointer-events: none. Write the unit tests for the functionality part.
Step 3: Expose the threshold to the user in the popup by the means of a slider, with values between 0 and 100%. Let the default be 30%. Let's call this slider sensitivity to the user. 

Things to take care of
1. Keep view and functionality separate.
2. Keep the code modular and easy to understand.
3. Keep the code DRY.
4. Keep the code clean and readable.
5. Keep the code maintainable.
6. Keep the code scalable.
7. Keep the code efficient.
8. Keep the code secure.
9. Keep the code reliable.
10. Keep the code easy to test.
11. Write comments in the code to make it easy to understand.

Please make the following changes
1. While mocking the embeddings, instead of using the hash function, let's call the API for the texts that we are using in the tests and store the responses for future tests.
2. We have used huggingface API for embeddings. Let's use the local model for embeddings - paraphrase-multilingual-MiniLM-L12-v2.

I have tried implementing the popup and dom manipulator. I have tested popup, but the DOM manipulator still needs to be tested. I have tried to implement client side transformer for semantic analysis but that didn’t work. Now I have to implement server side. I can do that in two ways - one build huggingface embedded model at my end in a server and expose that to the client or use openAI API. I think I will do the second one first because that will allow me to use this plugin by default for free in localhost.

I want to implement embeddings by implementing huggingface embeding model locally. So, I want to do away with OpenAI calling part in the code. Also, I want to first test the DOM manipulator functionality before building API calling functionality. So, for now, let's not build the embedded vector calling part. Let's just filter out the videos always and as we filter out a video, print in the console the video title.

## Implement embeddings API
Let's now implement the api call to get embeddings. Following are the instructions:
* The URL of the server is: http://127.0.0.1:8000/, but make it configurable
* Documentation is here: http://127.0.0.1:8000/docs
* 