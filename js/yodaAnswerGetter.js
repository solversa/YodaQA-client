/**
 * Created by Petr Marek on 3.7.2015.
 */


var CONNECTION_ADDRES = "http://qa.ailao.eu"
var DIRECTLY_SHOWED_QUESTIONS = 5; // Number of questions above drop down menu

var qid;  // id of the last posed question
var gen_sources, gen_answers;  // when this number changes, re-render
var answers;

/* Ajax function for retrieving questions and answers */
$(function () {
    $("#ask").ajaxForm({
        success: function (response) {
            setTimeout(function () {
                loadQuestion(response)
            }, 500);
        }
    });

    getToAnswerJson();
    setInterval(getToAnswerJson, 3100);

    getInProgressJson();
    setInterval(getInProgressJson, 3000);

    getAnsweredJson();
    setInterval(getAnsweredJson, 2900);
});

/* Shows question from url */
$(document).on("pagecreate", "#mainPage", function () {
    var qID = getParameterByName("qID", window.location.href);
    if (qID != null) {
        loadQuestion(qID);
    }
});

/* Gets parameter by name */
function getParameterByName(name, url) {
    var match = RegExp('[?&]' + name + '=([^&]*)')
        .exec(url);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

/* Gets question information and shows it */
function loadQuestion(q) {
    $("#answers_area").empty();
    qid = q;
    gen_sources = 0;
    gen_answers = 0;
    window.location.href = "#mainPage?qID=" + qid;
    getQuestionJson();
}

/* Gets and shows answered questions in list */
function getAnsweredJson() {
    $.get(CONNECTION_ADDRES + "/q/?answered", function (r) {
        showQuestionList($("#answered_area"), "answered", "Answered questions", r);
    });
}

/* Gets and shows answers in progress in list */
function getInProgressJson() {
    $.get(CONNECTION_ADDRES + "/q/?inProgress", function (r) {
        showQuestionList($("#inProgress_area"), "inProgress", "In progress", r);
    });
}

/* Gets and shows answers in processing in list */
function getToAnswerJson() {
    $.get(CONNECTION_ADDRES + "/q/?toAnswer", function (r) {
        showQuestionList($("#toAnswer_area"), "toAnswer", "Question queue", r);
    });
}

/* Create a titled listing of questions. */
function showQuestionList(area, listContainerID, title, list) {
    area.empty();
    if (list.length != 0) {
        var listContainer = createList(area, listContainerID, title, false, false);
    }
    list.forEach(function (q) {
        listContainer.append('<li><a href="javascript:showAnsweredQuestion(' + q.id + ')">' + q.text + '</a></li>');
    });
    $("#" + listContainerID).listview().listview("refresh");
}

/* Shows answers to selected questions and jumps to main page */
function showAnsweredQuestion(qId) {
    loadQuestion(qId);
    window.location.href = "#mainPage?qID=" + qId;
}

/* Retrieve, process and display json question information. */
function getQuestionJson() {
    $.get(CONNECTION_ADDRES + "/q/" + qid, function (r) {
        $('input[name="text"]').val(r.text);

        //shows answers
        if (r.answers && gen_answers != r.gen_answers) {
            var container = createList("#answers_area", "answers", null, false, true);
            showAnswers(container, r.answers);
            gen_answers = r.gen_answers;
        }

        //shows concepts and summary
        if (r.summary) {
            if (r.summary.concepts.length) {
                var container = createList("#concept_area", "concepts", "Concepts", true, false);
                showConcept(container, r.summary.concepts);
            } else {
                $("#concept_area").empty();
            }
            showAnswerType(r.summary);
        }

        //shows sources
        if (r.sources.length && gen_sources != r.gen_sources) {
            var container = createList("#sources_area", "questionSources", "Answer sources", true, false);
            showSources(container, r.sources);
            gen_sources = r.gen_sources;
        }

        if (r.finished) {
            $("#spinner").hide();
        } else {
            // keep watching
            setTimeout(getQuestionJson, 500);
        }
    });
}

/* Shows answer type */
function showAnswerType(summary) {
    var container = $("#answerType_area");
    container.empty();
    if (summary.lats.length) {
        container.append('<br>');
        container.append('<H2>Answer types</H2>');
        container.append('<p>' + summary.lats.join(', ').capitalizeFirstLetter() + '</p>');
    }

}

/* Capitalize first letter */
String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

/* Shows concepts on main page */
function showConcept(container, concepts) {
    container.empty();
    var i = 1;
    concepts.forEach(function (a) {
        container.append('' +
            '<li>' +
            '   <a href="http://en.wikipedia.org/?curid=' + a.pageId + '" target="_blank">' +
            '       <img src="img/wikipedia-w-logo.png" alt="Wikipedia" class="ui-li-icon">'
            + a.title +
            '   </a>' +
            '</li>');
        i++;
    });
    $("#concepts").listview().listview("refresh");
}

/* Creates and returns new list with containerID in area element */
function createList(area, containerID, title, br, collapsibleSet) {
    container = $("#" + containerID);
    if (!container.length) {
        if (br == true) {
            $(area).append('<br>');
        }
        if (title != null) {
            $(area).append('<H2>' + title + '</H2>');
        }
        if (collapsibleSet) {
            container = $('<div data-role="collapsibleset" data-iconpos="right" data-inset="true" id="' + containerID + '"></div>');
        } else {
            container = $('<ul data-role="listview" data-inset="true" id="' + containerID + '"></ul>');
        }
        $(area).append(container);
    }
    return container;
}

/* Create a table with answers. */
function showAnswers(container, answers) {
    container.empty();

    var i = 1;
    answers.forEach(function (a) {
        // FIXME: also deal with < > &
        //text = a.text.replace(/"/g, "&#34;");
        if (i <= DIRECTLY_SHOWED_QUESTIONS) {
            showAnswersDirectly(a, i, container);
        } else {
            showAnswersInDropDown(a, i, container);
        }
        i++;
    });

    $("#moreAnswers").collapsibleset();
    $("#answers").collapsibleset();

    if (!$('#spinner').length) {
        $("#answers_area").append('<img src="img/ajax-loader.gif" id="spinner" style="position: absolute;top: 50%;left:50%;transform: translate(-50%,-50%);">');
    }
}

/* Shows best answers directly */
function showAnswersDirectly(a, i, container) {
    text = a.text.replace(/"/g, "&#34;");
    var toAppend = $('' +
        '<div data-role="collapsible" id="' + i + '" class="answer" data-collapsed-icon="carat-d" data-expanded-icon="carat-u">' +
        '<H2>' +
        '<span style="color: ' + score_color(a.confidence) + '; display: inline-block; width:3.5em;">' + (a.confidence * 100).toFixed(1) + '%' + '</span>' +
        '<span>' +
        text +
        '</span>' +
        '</H2>' +
        '<p>AREA FOR ANSWER DETAILS</p>' +
        '</div>')
    container.append(toAppend);
    //toAppend.collapsible();
}

/* Shows answers in drop down menu */
function showAnswersInDropDown(a, i, container) {
    var dropDownList = $("#moreAnswers");
    if (!dropDownList.length) {
        createDropDownList(container, "answersDropDownLI", "More answers...", "moreAnswers");
        dropDownList = $("#moreAnswers");
    }

    text = a.text.replace(/"/g, "&#34;");
    var toAppend = $('' +
        '<div id=' + i + ' data-collapsed-icon="carat-d" data-expanded-icon="carat-u" data-role="collapsible">' +
        '   <H2>' +
        '<span style="color: ' + score_color(a.confidence) + '; display: inline-block; width:3.5em;">' + (a.confidence * 100).toFixed(1) + '%' + '</span>' +
        '<span>' + text + '</span>' +
        '   </H2>' +
        '<p>AREA FOR ANSWER DETAILS</p>' +
        '</div>');
    dropDownList.append(toAppend);
    //toAppend.collapsible();
}

/* Creates base for drop down menu */
function createDropDownList(container, liID, title, divID) {
    container.append('' +
        '<div data-role="collapsible" data-iconpos="right" data-inset="true" id="' + liID + '" data-theme="b" data-content-theme="a">' +
        '   <h2>' + title + '</h2> ' +
        '   <div data-role="collapsibleset" data-iconpos="right" data-inset="false"  id="' + divID + '"> ' +
        '   </div>' +
        '</div>');
}

/* Create a box with answer sources. */
function showSources(container, sources) {
    container.empty();
    var i = 1;
    sources.forEach(function (s) {
        container.append('' +
            '<li>' +
            '   <a href="http://en.wikipedia.org/?curid=' + s.pageId + '" target="_blank">' +
            '       <img src="img/wikipedia-w-logo.png" alt="Wikipedia" class="ui-li-icon">'
            + s.title +
            '      (' + s.origin + ')' +
            '   </a>' +
            '</li>');
        i++;
    });
    $('#questionSources').listview().listview("refresh");
}

/* Returns color for score */
function score_color(score) {
    var green = Math.round(200 * score + 25);
    var red = Math.round(200 * (1 - score) + 25);
    return 'rgb(' + red + ',' + green + ',0)';
}

function showAnswerDescriptions(aText, aConfidence) {
    showAnswerDescription(aText, aConfidence);
    window.location.href = "#answer-description";
}

function showAnswerDescription(aText, aConfidence) {
    showAnswerText(aText);
    showAnswerConfidence(aConfidence);
}

function showAnswerText(aText) {
    var container = $("#answerText");
    container.empty();
    container.append(aText);
}

function showAnswerConfidence(aConfidence) {
    var container = $("#answerConfidence");
    container.empty();
    container.append(aConfidence);
}