*** Settings ***
Documentation       The design tools work.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Coverage.resource
Resource            ../../resources/Deck.resource
Resource            ../../resources/Lab.resource
Resource            ../../resources/Screenshots.resource
Resource            ../../resources/Docs.resource
Resource            ../../resources/Design.resource

Suite Setup         Set Up Interactive Suite    design
Suite Teardown      Tear Down Interactive Suite
Test Teardown       Reset Interactive Test

Force Tags          suite:design


*** Test Cases ***
Slide Layover Basics
    [Documentation]    Use the design tools to work with parts.
    Set Attempt Screenshot Directory    lab${/}design${/}layover-smoke
    Start Basic Notebook Deck
    Maybe Open Slide Layout
    Capture Page Screenshot    00-layover.png
    Maybe Close Design Tools
    Capture Page Screenshot    01-presenting.png
    [Teardown]    Maybe Close Design Tools
