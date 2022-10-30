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
Build A Slide With Design Tools
    [Documentation]    Use the design tools to work with parts.
    Set Attempt Screenshot Directory    lab${/}design${/}
    Start Basic Notebook Deck
    Maybe Open Design Tools
