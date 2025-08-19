# Conscious YouTube

## Problem statement and objective
Youtube gives content suggestions at different places. The content is optimized so that the user spends most of his/her time in youtube and not on the basis of what user consciously wants to see. There are some controls given by Youtube, like subscribe / unsubscribe, don’t recommend from this channel, don’t show this type of content, etc. But subconscious choice of watching behavior usually takes over the conscious choice of these loose controls. The objective is to help the user have a more conscious control on the youtube recommendations.

## High level feature description
User will let the plugin know the topics he / she doesn't want to see in the youtube recommendations. When a youtube page loads, the plugin will read the information of each youtube recommendation, identify if it belongs to one of the topics that the user provided to be excluded and remove the youtube recommendation if the recommendation belongs to the excluded topic list.

## Personas
Only one persona - user

## User stories
* As a user, I should be able to save, edit and remove the topics that I don't want to see in the youtube recommendations, so that when I load the youtube in the browser later on, the plugin is able to exclude the videos that belong to these topics.
Following is the intended behavior
    * Upon addition of a topic name, it gets saved in the local storage of chrome and immediately appears in the list in UI as well
    * User should not be able to add blank or duplicate topic names. Appropriate message should appear. Case of the input and whitespaces should not matter while checking for duplicates
