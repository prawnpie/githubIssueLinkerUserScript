// ==UserScript==
// @name         GitHub -> JIRA linker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  In GitHub, adds links to Oath JIRA pages is the JIRA ticket is referred to as [XXX-###] in the PR title.
// @author       Volker Neumann
// @match        https://github.com/*
// @grant        none
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==
(function() {


    // TODO:
    // * refactor shared code for adding secondLine links
    // * add link when viewing commit details page


    'use strict';

    var jiraTicketPath = "https://jira.your_org.com/browse/";
    var linkTemplate = '<span class="d-inline-block">[<a class="muted-link" href="' + jiraTicketPath + 'ISSUE_ID">ISSUE_ID</a>]</span>&nbsp;';

    function doIt() {

        var path = window.location.pathname;

        // PR list - /org/proj/pulls
        if (path.match(/^\/.*\/.*\/pull\/\d+$/)) {
            console.log("doing single pull request details");
            // insert link into titles on PR page
            $("span.js-issue-title").html(function() {
                return $(this).html().replace(/\[([A-Z]+-\d+)\]/g, '[<a href="' + jiraTicketPath + '$1">$1</a>]');
            });
        }

        // PR details: /org/proj/pull/12345
        else if (path.match(/^\/.*\/.*\/pulls$/)) {
            console.log("doing pull request list");
            // add links into row on the PR list page
            var issueDivs = $("ul.js-active-navigation-container li div div:nth-of-type(3)");

            for (var i = 0; i < issueDivs.length; i++) {
                var issueDiv = $(issueDivs[i]);
                var link = $("a.js-navigation-open", issueDiv)[0];
                var linkText = $(link).html();
                var secondLine = $("div.mt-1", issueDiv)[0];
                var matches = linkText.match(/\[[A-Z]+-\d+\]/g);
                if (matches) {
                    for (var j = 0; j < matches.length; j++) {
                        var match = matches[j];
                        var issueId = /\[([A-Z]+-\d+)\]/g.exec(match)[1];
                        var linkHtml = linkTemplate.replace(/ISSUE_ID/g, issueId);
                        $(secondLine).append(linkHtml);
                    }
                }
            }
        }

        // pr commits: /org/proj/pull/####/commits
        // branch commits: /org/proj/commits/[branchName]
        else if (path.match(/^\/.*\/.*\/commits\/.*/) || path.match(/^\/.*\/.*\/pull\/\d+\/commits$/)) {
            console.log("doing commits");
            var commitTitleParagraphs = $("p.commit-title");
            if (commitTitleParagraphs) {
                for (var i = 0; i < commitTitleParagraphs.length; i++) {
                    var commitTitleParagraph = commitTitleParagraphs[i];
                    var commitCell = commitTitleParagraph.parentElement;
                    var commitLink = $("a", commitTitleParagraph)[0];
                    var linkText = $(commitLink).html();
                    var secondLine = $("div.commit-meta", commitCell)[0];
                    var matches = linkText.match(/\[[A-Z]+-\d+\]/g);
                    if (matches) {
                        for (var j = 0; j < matches.length; j++) {
                            var match = matches[j];
                            var issueId = /\[([A-Z]+-\d+)\]/g.exec(match)[1];
                            var linkHtml = linkTemplate.replace(/ISSUE_ID/g, issueId);
                            $(secondLine).append(linkHtml);
                        }
                    }

                }
            }
        }
    }

    $(document).ready(function() {
        doIt();
    });

    document.addEventListener('pjax:end', doIt);

})();