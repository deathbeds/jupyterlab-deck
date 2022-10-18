*** Settings ***
Documentation       Tests for JupyterLab.

Library             JupyterLibrary
Resource            ../../resources/Coverage.resource

Suite Setup         Wait For New Jupyter Server To Be Ready
Suite Teardown      Terminate All Jupyter Servers
Test Teardown       Reset JupyterLab And Close With Coverage

Force Tags          app:lab
