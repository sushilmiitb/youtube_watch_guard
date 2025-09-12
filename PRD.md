# Conscious YouTube

## Problem statement and objective
Youtube gives content suggestions at different places. The content is optimized so that the user spends most of his/her time in youtube and not on the basis of what user consciously wants to see. There are some controls given by Youtube, like subscribe / unsubscribe, don’t recommend from this channel, don’t show this type of content, etc. But subconscious choice of watching behavior usually takes over the conscious choice of these loose controls. The objective is to help the user have a more conscious control on the youtube recommendations.


## High level feature description
User will let the plugin know the topics he / she doesn't want to see in the youtube recommendations. When a youtube page loads, the plugin will read the information of each youtube recommendation, identify if it belongs to one of the topics that the user provided to be excluded and remove the youtube recommendation if the recommendation belongs to the excluded topic list.

## Personas
Only one persona - user

# Feature: Filter the content
## Problem statement and high level solution
We often go to the youtube with some specific intent. But in the recommendation section of home feed page and watch page, we see suggestions of video that is influenced by our watch behavior from the past which was often an unconscious choice. The visuals of these recommendations are so strong that we end up start watching these videos.

On the basis of the topics entered by the user, filter out the video recommendations with semantic matching of the topic and title. The filtered recommendation can be either deleted, or made inactive.
## User story: Give user ability to add and manage topic exclude list
* As a user, I should be able to save, edit and remove the topics that I don't want to see in the youtube recommendations, so that when I load the youtube in the browser later on, the plugin is able to exclude the videos that belong to these topics.
Following is the intended behavior
    * Upon addition of a topic name, it gets saved in the local storage of chrome and immediately appears in the list in UI as well
    * User should not be able to add blank or duplicate topic names. Appropriate message should appear. Case of the input and whitespaces should not matter while checking for duplicates

## User story: Filter content on the basis of semantic match of titles and topics using hugging face embeddings
* As a user, I want that when I visit the youtube's homepage, the videos that belong to the topics I have entered in the exclude list, do not appear in my screen.

### Pros and cons
Embeddings are cheap but do not have a very high accuracy. If we use LLM APIs, they are likely to be more accurate but will be costly.

### Implementation details
* Create a backend python service that can be self-hosted that returns embedings of the texts
* In the extension, when the user visit either of the pages, retrieve the topics of all the video recommendations
* Do a cosine match of the topics and video titles and if the match is higher then a threshold, disable the video recommendation.
* Provide the user a way to adjust the threshold in the UI
* Provide the UI for the user to decide if he/she wants to disable the video recommendation or remove it completely. Implement the removal part.

# Feature - remove youtube recommendation section
## Problem statement and high level solution
Our unconscious watching happens on both long form videos and short form videos. But more often it happens on the short form videos. Also, we need long form videos for learning purposes as well. The role that short form videos play in learning is not very high. So, in addition to filtering of videos on the basis of an exclude topic list, we can give an option to the user to completely remove the shorts section from the feed.
## Feature description
As an end user, I should be able to tell the plugin to remove the youtube shorts section and when I visit it the next time, I should not see the youtube shorts section at all from my home feed, search result page and the recommendation section in the watch page.

# Feature - Mark videos as not interested
## Problem statement and high level solution
In the home feed page, youtube allows us to mark certain videos as not interested. If we mark them as such, youtube algorithm takes a note of that and shows lesser of that type of content to us. The problem is that on day to day basis, we default to our unconscious behavior and youtube eventually start showing that contet back to us.
We have already implemented some solution above to solve this. We can use this one more tool. Youtube does a categorization of the videos it is showing to us in the home feed. User can decide which topic he/she doesn't want to see, click those, and ask this tool to mark top 10 videos as not interested. The tool will remind regularly to the user to do this exercise again and again.