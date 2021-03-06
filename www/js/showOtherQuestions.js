/**
 * Created by Petr Marek on 09.02.2016.
 * Handles showing of answered question, in progress questions and to answer questions in lists
 */

/* Gets and shows answers in progress in list */
function getInProgressJson() {
    if (CONNECTION_ADDRESS != null) {
        $.get(CONNECTION_ADDRESS + "q/?inProgress", function (r) {
            eraseHtmlTagsInObjectFields(r);
            showQuestionList($("#inProgress_area"), "inProgress", "In progress", r, false);
        });
    }
}

/* Gets and shows answers in processing in list */
function getToAnswerJson() {
    if (CONNECTION_ADDRESS != null) {
        $.get(CONNECTION_ADDRESS + "q/?toAnswer", function (r) {
            eraseHtmlTagsInObjectFields(r);
            showQuestionList($("#toAnswer_area"), "toAnswer", "Question queue", r, false);
        });
    }
}

function getDialogsJson() {
    if (CONNECTION_ADDRESS != null) {
        $.get(CONNECTION_ADDRESS + "q/?dialogs", function (r) {
            eraseHtmlTagsInObjectFields(r);
            showQuestionList($("#dialogs_area"), "dialogs", "Passed dialogs", r, true);
        });
    }
}

/* Create a titled listing of questions. */
function showQuestionList(area, listContainerID, title, list, dialog) {
    area.empty();
    if (list.length != 0) {
        var listContainer = createList(area, listContainerID, title, false, false);
    }
    list.forEach(function (q) {
        if (!dialog) {
            listContainer.append('<li><a href="javascript:showAnsweredQuestion(' + q.id + ')">' + q.text + '</a></li>');
        } else {
            var dialogText="";
            for (var i=0;i< q.dialogQuestions.length;i++){
                dialogText+= q.dialogQuestions[i].text+" ";
            }
            listContainer.append('<li><a href="javascript:openDialog(\'d_' + q.id + '\')">' + dialogText + '</a></li>');
        }
    });
    $("#" + listContainerID).listview().listview("refresh");
}

/* Shows answers to selected questions and jumps to main page */
function showAnsweredQuestion(qId) {
    window.location.href = createURL(null,qId);
}

function loadQuestionNoCard(q, reload) {
    $("#answers_area").empty();
    $("#concept_area").empty();
    $("#sources_area").empty();
    if (reload) {
        window.location.href = createURL(q);
    } else {
        window.history.replaceState("object or string", "Title", createURL(q));
    }
    getQuestionJson();
}

function loadDialog(dID){
    putDialogIDToForm(dID);
    getDialogJson(dID);
}

function openDialog(dID){
    window.location.href = createURL(dID);
}