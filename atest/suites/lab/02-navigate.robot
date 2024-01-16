*** Settings ***
Documentation       Building a deck interactively is fun.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Lab.resource
Resource            ../../resources/Screenshots.resource
Resource            ../../resources/Docs.resource
Resource            ../../resources/Design.resource

Suite Setup         Set Up Interactive Suite    navigate
Suite Teardown      Tear Down Interactive Suite
Test Teardown       Reset Interactive Test

Force Tags          suite:navigate    activity:notebook


*** Test Cases ***
Build and Navigate a Notebook Slide With Keyboard
    [Documentation]    Build and navigate a basic slide.
    Set Attempt Screenshot Directory    lab${/}navigate${/}keyboard
    Start Basic Notebook Deck
    Really Back Up Deck With Keyboard    s0-03-backup.png    item1234
    Really Back Up Deck With Keyboard    s0-04-backup.png    World
    Really Advance Notebook Deck With Keyboard    s0-05-advance.png    item1234
    Really Advance Notebook Deck With Keyboard    s0-06-advance.png    item4567

Build and Navigate a Notebook Slide With Anchors
    [Documentation]    Build and navigate a basic slide.
    Set Attempt Screenshot Directory    lab${/}navigate${/}anchors
    Start Notebook Deck With Anchors
    Click Element    css:${CSS_DECK_VISIBLE} a[href^\="#Hello-World"]
    Wait Until Element Is Visible    css:${CSS_DECK_VISIBLE} h1
    Capture Page Screenshot    s1-02-back.png

Build and Navigate a Notebook Slide With Subslides
    [Documentation]    Build and navigate a slide with subslides.
    Set Attempt Screenshot Directory    lab${/}navigate${/}subslides
    Start Notebook Deck With Subslides
    Really Back Up Deck With Keyboard    s2-03-backup.png    subslide 1
    Really Back Up Deck With Keyboard    s2-04-backup.png    item4567
    Really Advance Notebook Deck With Keyboard    s2-05-advance.png    subslide 1
    Really Advance Notebook Deck With Keyboard    s2-06-advance.png    subslide 2
