let messages = [];
let mode;

$(document).ready(function () {
    $('#prompt-input').on('keypress', function (e) {
        if (e.which == 13) {  // Enter key pressed

        }
    });
});

function create_message(text, role) {
    return $('<div class="message ' + role + '">').append(
        $('<p class="text">').text(text)
    );
}

$(document).ready(function () {
    function setUrlParameter(paramName, paramValue) {
        var url = window.location.href;
        var re = new RegExp("([?&])" + paramName + "=.*?(&|$)", "i");
        var separator = url.indexOf('?') !== -1 ? "&" : "?";
        var newUrl;

        if (url.match(re)) {
            newUrl = url.replace(re, '$1' + paramName + "=" + paramValue + '$2');
        } else {
            newUrl = url + separator + paramName + "=" + paramValue;
        }

        history.pushState(null, null, newUrl);
        return newUrl;
    }

    function getUrlParameter(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results == null) {
            return null;
        } else {
            return decodeURIComponent(results[1]) || 0;
        }
    }

    function setMode(m) {
        mode = m;
        messages = [];
        $("#conversation-content").html("");
        setUrlParameter("mode", mode);
        var button = $('.modes input[type="radio"][value="' + mode + '"]');
        button.prop("checked", true);
        $(".current-model-name").text(button.data("modeName"));
    }

    function prompt() {
        let input = $("#prompt-input");
        let prompt = input.val();
        input.val('');

        if (prompt === '') {
            return;
        }

        messages.push({"role": "user", "content": prompt});

        $("#conversation-content").append(
            create_message(prompt, "user")
        );

        adjustTextareaHeight();

        $.ajax({
            url: '/prompt',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                mode: mode,
                messages: messages
            }),
            success: function (response) {
                console.log(response)
                messages.push(response);
                $("#conversation-content").append(
                    create_message(response.content, "gpt")
                );
            }
        });
    }

    $('.modes input[type="radio"]').on('change', function () {
        setMode($(this).val());
    });

    function adjustTextareaHeight() {
        // Adjust the height based on the scroll height
        $('#prompt-input').css('height', 'auto'); // Reset height to auto
        $('#prompt-input').css('height', $('#prompt-input').prop('scrollHeight') + 'px');
    }

    $('#prompt-input').on('input', adjustTextareaHeight); // Adjust height on input

    $('#prompt-input').on('keypress', function (e) {
        // if (e.which == 13) {  // Enter key pressed
        //     prompt();
        // }

        if (e.keyCode == 13 && !e.shiftKey) {  // Enter key pressed without Shift
            e.preventDefault();  // Prevent default action (newline)
            prompt();
        }
    });

    $('#send-button').on('click', function () {
        prompt();
    });

    $("#prompt-input").focus();

    adjustTextareaHeight();

    mode = getUrlParameter("mode");
    if (mode === null) {
        mode = "shit";
    }
    setMode(mode)
});