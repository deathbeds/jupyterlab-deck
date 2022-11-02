*** Settings ***
Documentation       Building a deck interactively is fun.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Lab.resource
Resource            ../../resources/Screenshots.resource
Resource            ../../resources/Docs.resource
Resource            ../../resources/Sidebar.resource

Suite Setup         Set Up Interactive Suite    layers
Suite Teardown      Tear Down Interactive Suite
Test Teardown       Reset Interactive Test

Force Tags          suite:layers    feature:layers    activity:notebook


*** Variables ***
${FADE_JSON}    "opacity": "0.125"


*** Test Cases ***
Build A Slide With Layers
    [Documentation]    Use the sidebar to work with layers.
    Set Attempt Screenshot Directory    lab${/}interactive${/}layers
    Start Basic Notebook Deck
    Make Markdown Cell    - item91011    item91011    screenshot=s0-03-91011.png
    Make Markdown Cell    - item121314    item121314    screenshot=s0-04-121314.png
    Make Cell Layer With Sidebar    2    deck    s0-05-deck.png
    Make Cell Layer With Sidebar    3    stack    s0-06-stack.png
    Make Cell Layer With Sidebar    4    slide    s0-07-slide.png
    Make Cell Layer With Sidebar    4    -    s0-08-null.png
    Make Cell Layer With Sidebar    5    fragment    s0-09-fragment.png

Build A Slide With Style Presets
    [Documentation]    Use the sidebar to work with presets.
    Set Attempt Screenshot Directory    lab${/}interactive${/}presets
    Start Basic Notebook Deck
    Use Cell Style Preset    2    fade-out    ${FADE_JSON}    s0-03-fragment-fade.png
    Make Cell Layer With Sidebar    2    deck    s0-04-deck-layer.png
    Capture Page Screenshot    s0-05-deck.png
    [Teardown]    Stop Deck With Remote
