*** Settings ***
Documentation       The examples work.

Library             OperatingSystem
Library             JupyterLibrary
Resource            ../../resources/Fixtures.resource
Resource            ../../resources/Deck.resource

Suite Setup         Set Up Example Suite
Suite Teardown      Tear Down Example Suite
Test Teardown       Reset Example Test


*** Test Cases ***
Example README works
    [Documentation]    The README included in the examples operates as expected.
    Open Example    README.ipynb
    Capture Page Screenshot    00-before-deck.png
    Start Deck With Notebook Toolbar Button
    Capture Page Screenshot    01-deck.png
    Visit Slides And Fragments With Remote    02-walk
    Stop Deck With Remote
    Capture Page Screenshot    03-after-deck.png


*** Keywords ***
Set Up Example Suite
    [Documentation]    Prepare for this suite.
    Set Screenshot Directory    ${OUTPUT_DIR}${/}lab${/}examples
    Copy Examples
    Open JupyterLab

Tear Down Example Suite
    [Documentation]    Clean up after this suite.
    Clean Examples With Coverage

Reset Example Test
    [Documentation]    Clean up after each test.
    Execute JupyterLab Command    Close All Tabs
    Execute JupyterLab Command    Shut Down All Kernels
