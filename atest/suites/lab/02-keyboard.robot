*** Settings ***
Documentation       Building a deck interactively is fun.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Lab.resource
Resource            ../../resources/Screenshots.resource
Resource            ../../resources/Docs.resource

Suite Setup         Set Up Interactive Suite    keyboard
Suite Teardown      Tear Down Interactive Suite
Test Teardown       Reset Interactive Test

Force Tags          suite:keyboard


*** Test Cases ***
Build and Navigate a Notebook Slide With Keyboard
    [Documentation]    Build and navigate a basic slide.
    Set Attempt Screenshot Directory    lab${/}interactive${/}slide
    Start Basic Notebook Deck
    Really Back Up Deck With Keyboard    s0-03-backup.png    item1234
    Really Back Up Deck With Keyboard    s0-04-backup.png    World
    Really Advance Deck With Keyboard    s0-05-advance.png    item1234
    Really Advance Deck With Keyboard    s0-06-advance.png    item4567
