// ==UserScript==
// @name         GitHub -> JIRA linker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  In GitHub, adds links to the JIRA tickets referred to as [XXX-###] in the PR/commit title.
// @author       Volker Neumann
// @match        https://github.com/*
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==
(function() {
    'use strict';

    // TODO:
    // * add link when viewing commit details page

    var jiraTicketPath = "https://jira.your_org.com/browse/";
    var linkTemplate = '<span class="d-inline-block">[<a class="muted-link" href="' + jiraTicketPath + 'ISSUE_ID">ISSUE_ID</a>]</span>&nbsp;';

    function doIt() {
        var path = window.location.pathname;
        if (path.match(/^\/.*\/.*\/pull\/\d+$/)) {
            // PR details: /org/proj/pull/12345
            handlePrDetail();
        } else if (path.match(/^\/.*\/.*\/pulls$/)) {
            // PR list - /org/proj/pulls
            handlePrList();
        } else if (path.match(/^\/.*\/.*\/commits\/.*/) || path.match(/^\/.*\/.*\/pull\/\d+\/commits$/)) {
            // pr commits: /org/proj/pull/####/commits
            // branch commits: /org/proj/commits/[branchName]
            handleCommitList();
        }
    }

    function handlePrDetail() {
        console.log("doing single pull request details");
        // insert link into titles on PR page
        $("span.js-issue-title").html(function() {
            return $(this).html().replace(/\[([A-Z]+-\d+)\]/g, '[<a href="' + jiraTicketPath + '$1">$1</a>]');
        });
    }

    function handlePrList() {
        console.log("doing pull request list");
        // add links into row on the PR list page
        var issueDivs = $("ul.js-active-navigation-container li div div:nth-of-type(3)");

        for (var i = 0; i < issueDivs.length; i++) {
            var issueDiv = $(issueDivs[i]);
            var link = $("a.js-navigation-open", issueDiv)[0];
            var linkText = $(link).html();
            var secondLine = $("div.mt-1", issueDiv)[0];
            addLinksToSecondLine(secondLine, linkText);
        }
    }

    function handleCommitList() {
        console.log("doing commits");
        var commitTitleParagraphs = $("p.commit-title");
        if (commitTitleParagraphs) {
            for (var i = 0; i < commitTitleParagraphs.length; i++) {
                var commitTitleParagraph = commitTitleParagraphs[i];
                var commitCell = commitTitleParagraph.parentElement;
                var commitLink = $("a", commitTitleParagraph)[0];
                var linkText = $(commitLink).html();
                var secondLine = $("div.commit-meta", commitCell)[0];
                addLinksToSecondLine(secondLine, linkText);
            }
        }
    }

    function addLinksToSecondLine(secondLine, linkText) {
        var matches = linkText.match(/\[[A-Z]+-\d+\]/g);
        if (matches) {
            for (var i = 0; i < matches.length; i++) {
                var match = matches[i];
                var issueId = /\[([A-Z]+-\d+)\]/g.exec(match)[1];
                var linkHtml = linkTemplate.replace(/ISSUE_ID/g, issueId);
                $(secondLine).append(linkHtml);
            }
        }
    }

    $(document).ready(function() {
        doIt();
    });

    document.addEventListener('pjax:end', doIt);

})();