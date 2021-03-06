// ==UserScript==
// @name         GitHub -> JIRA linker
// @namespace    http://tampermonkey.net/
// @description  In GitHub, adds links to the JIRA tickets referred to as [XXX-###] in the PR/commit title.
// @version      0.4
// @author       Volker Neumann
// @match        https://github.com/*
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==
(function() {
    'use strict';

    // TODO:
    // * add link when viewing commit details page
    // * going to PR and then clicking on one of the PR commits leads to error logging

    var jiraTicketPath = "https://jira.your_org.com/browse/";
    var linkTemplate = '<span class="d-inline-block">[<a class="muted-link" href="' + jiraTicketPath + 'ISSUE_ID">ISSUE_ID</a>]</span>&nbsp;';

    function doIt() {
        var path = window.location.pathname;
        if (path.match(/^\/.*\/.*\/pull\/\d+$/) || path.match(/^\/.*\/.*\/pull\/\d+\/commits$/) || path.match(/^\/.*\/.*\/pull\/\d+\/files$/)) {
            // PR details: /org/proj/pull/12345, /org/proj/pull/12345/commits, /org/proj/pull/12345/files
            handlePrDetail();
            if( path.match(/^\/.*\/.*\/pull\/\d+\/commits$/) ){
                handleCommitList();
            }
        } else if (path.match(/^\/.*\/.*\/pulls$/)) {
            // PR list - /org/proj/pulls
            handlePrList();
        } else if (path.match(/^\/.*\/.*\/commits\/.*/)) {
            // branch commits: /org/proj/commits/[branchName]
            handleCommitList();
        } else if (path.match(/^\/.*\/.*\/releases*$/) || path.match(/^\/.*\/.*\/releases\/tag\/.*$/) ) {
            // PR details: /org/proj/releases or /org/proj/releases/tag/*
            handleReleases();
        }
    }

    /**
     * insert link into titles on PR page
     */
    function handlePrDetail() {
        console.log("doing single pull request details");
        $("span.js-issue-title").html(function() {
            return $(this).html().replace(/\[([A-Z]+-\d+)\]/g, '[<a href="' + jiraTicketPath + '$1">$1</a>]');
        });
        var saveButton = $("#edit_header_2468282 > button.btn")
        if( ! saveButton.hasClass("hasListener") ){
            // don't want to add duplicate listeners, hasListener class is a marker
            saveButton.click( runHandlePrDetailLater );
            saveButton.addClass("hasListener");
        }
    }

    function runHandlePrDetailLater(){
        setTimeout( handlePrDetail, 3000 ); // loose :( but how to detect when the title gets changed by someone else?
    }

    /**
     * add links into second line on the PR list page
     */
    function handlePrList() {
        console.log("doing pull request list");
        $("div.js-active-navigation-container div.js-navigation-item div div.p-2").each(function() {
            var issueDiv = $(this);
            var link = $("a.js-navigation-open", issueDiv)[0];
            var linkText = $(link).html();
            var secondLine = $("div.mt-1", issueDiv)[0];
            addLinksToSecondLine(secondLine, linkText);
        });
    }

    /**
     * add links into second line on a commit list page
     */
    function handleCommitList() {
        console.log("doing commits");
        $("p.commit-title").each(function() {
            var commitTitleParagraph = this;
            var commitCell = commitTitleParagraph.parentElement;
            var commitLink = $("a", commitTitleParagraph)[0];
            var linkText = $(commitLink).html();
            var secondLine = $("div.commit-meta", commitCell)[0];
            addLinksToSecondLine(secondLine, linkText);
        });
    }

    function handleReleases(){
        console.log("doing releases");
        $("div.markdown-body").html(function() {
            // TODO: fix up code duplication with handlePrDetail.
            return $(this).html().replace(/\[([A-Z]+-\d+)\]/g, '[<a href="' + jiraTicketPath + '$1">$1</a>]');
        });
    }


    /**
     * given the text of a commit or pr, find the issues and link to them at the end of the secondLine div
     *
     * @param secondLine a DIV to which the links will be added
     * @param linkText the text from which the links will be parsed
     **/
    function addLinksToSecondLine(secondLine, linkText) {
        var issueIdsWithBrackets = linkText.match(/\[[A-Z]+-\d+\]/g);
        if (issueIdsWithBrackets) {
            for (var i = 0; i < issueIdsWithBrackets.length; i++) {
                var issueIdWithBrackets = issueIdsWithBrackets[i];
                var issueId = /\[([A-Z]+-\d+)\]/g.exec(issueIdWithBrackets)[1];
                var linkHtml = linkTemplate.replace(/ISSUE_ID/g, issueId);
                var alreadyLinked = $(secondLine).html().includes(issueId);
                if( !alreadyLinked ){
                    $(secondLine).append(linkHtml);
                }
            }
        }
    }

    $(document).ready(function() {
        doIt();
    });

    document.addEventListener('pjax:end', doIt);

})();
