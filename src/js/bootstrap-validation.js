/*!
 * jQuery Bootstrap Validation
 * Original author: @patiernom
 * Further changes, comments:
 * Licensed under the MIT license
 */

"use strict";

;(function ($, window, document, undefined) {
    var regexParser = /\[(.*)]/;

    var pluginName = "bootstrapValidation",
        defaults = {
            formCssClass: 'bootstrap-validate-form',
            realTime: false,
            allowGlobal: false,
            domRoot: '',
            errorPlaceholder: '',
            errorAppendToForm: false,
            errorCssClass: "has-error",
            errorType: "popover", // inline
            oneError: false,
            submitHandler: function(){},
            afterValidation: function(status){}
        },
        getPluginName = function(){
            return "plugin_" + pluginName;
        },
        getOptions = function(element){
            return $(element).parents('form').data(getPluginName()).options;
        },
        messageStrategy = (function () {
            var response = [];

            response["inline"] = function (field, message) {
                field.data('original-placeholder', field.attr('placeholder'));
                field.attr('placeholder', message);
                field.addClass('inline-error');
            };

            response["outline"] = function (field, message) {
                updateOutlineMessage(field, message);
            };

            response["popover"] = function (field, message) {
                updateMessage(field, message);
            };

            response["single"] = function (field, message) {
                updateSingleMessage(field, message);
            };

            return response;
        }()),
        propageEvent = function(element, state){
            if (getOptions(element).afterValidation) {
                getOptions(element).afterValidation(state);
            }
        },
        eventStrategy = (function () {
            var response = [];

            response["inline"] = function (element) {
                $(element).attr('placeholder', $(element).data('original-placeholder'));
                $(element).removeClass('inline-error');
                propageEvent(element, 'clear');
            };

            response["outline"] = function (element) {
                $(element).parents('.form-group').removeClass(getOptions(element).errorCssClass);
                removeOutlineMessage(element);
                propageEvent(element, 'clear');
            };

            response["popover"] = function (element) {
                $(element).next('.popover').remove();
                propageEvent(element, 'clear');
            };

            response["single"] = function (element) {
                $(element).parents('.form-group').removeClass(getOptions(element).errorCssClass);
                removeSingleMessage();
                propageEvent(element, 'clear');
            };

            return response;
        }()),
        validateGlobalField = (function () {
            var response = [];
            response["default"] = function (element, message) {
                var isValid = false;
                getInputs(element).each(function () {
                    if ($(this).val()) {
                        isValid = true;
                    }
                });
                if (!isValid) {
                    updateGlobalStatus(element, message);
                }
                return isValid;
            };

            return response;
        }()),
        validateField = (function () {
            var response = [];

            response["regex"] = function (element, message, pattern) {
                return checkRegexp($(element), pattern, message);
            };

            response["invalid-chars"] = function (element, message, pattern) {
                return checkInvalidChars($(element), pattern, message);
            };

            response["list"] = function (element, message, list) {
                return checkList($(element), list, message);
            };

            response["maxlength"] = function (element, message, pattern) {
                return checkMaxLength($(element), pattern, message);
            };

            response["minlength"] = function (element, message, pattern) {
                return checkMinLength($(element), pattern, message);
            };

            response["checkbox"] = function (element, message) {
                return checkSelectOrNo($(element), message);
            };

            response["combobox"] = function (element, message) {
                return checkSelectVal($(element), message);
            };

            response["default"] = function (element, message) {
                if ($(element).val()) {
                    return true;
                } else {
                    updateStatus($(element), message);
                    return false;
                }
            };

            return response;
        }()),
        setEventsRules = (function () {
            var response = [];
            response["lock-chars"] = function (element) {
                $(element).on('keypress', function (e) {
                    var key = e.which || e.keyCode || 0,
                        digitChar = String.fromCharCode(key),
                        regexp = $(this).data('lock-chars-rule');

                    if (regexp && key !== 8 && key !== 13) {
                        regexp = new RegExp(regexp, 'gi');
                        var invalidChar = regexp.exec(digitChar);
                        if (invalidChar) {
                            return false;
                        }
                    }
                    return true;
                });
            };

            response["list"] = function (element) {
                $(element).on('blur', function () {
                    return checkList(this, $(this).data('list'), $(this).data('list-msg'));
                });
            };
            return response;
        }()),
        setGlobalValidationRules = (function () {
            var response = [];
            response["required"] = function (element, mandatory, callback) {
                var action = "default";

                callback(true, false, action, element, $(element).data('required-msg') || "Compila tutti i campi!");
            };
            return response;
        }()),
        setValidationRules = (function () {
            var response = [];

            response["optional"] = function (element, tagInfo, mandatory, callback) {
                if ((tagInfo.elementLocalName === "input" && tagInfo.elementType === "checkbox") || (tagInfo.elementLocalName === "select")) {
                    callback(false, true, "default");
                } else {
                    if (!$(element).val()) {
                        callback(false, true, "default", element);
                    } else {
                        callback(true, false, "default", element);
                    }
                }
            };

            response["required"] = function (element, tagInfo, mandatory, callback) {
                var action = "default";

                if (tagInfo.elementLocalName === "select") {
                    action = "combobox";
                }

                if (tagInfo.elementType === "checkbox") {
                    action = "checkbox";
                }

                callback(true, false, action, element, $(element).data('required-msg') || "questo campo è richiesto!");
            };

            response["regex"] = function (element, tagInfo, mandatory, callback) {
                callback(mandatory, false, "regex", element, $(element).data('regex-msg') || "questo campo è richiesto!", $(element).data('regex-rule'));
            };

            response["invalid-chars"] = function (element, tagInfo, mandatory, callback) {
                callback(mandatory, false, "invalid-chars", element, $(element).data('invalid-chars-msg') || "Caratteri non ammessi", $(element).data('invalid-chars-rule'));
            };

            response["list"] = function (element, tagInfo, mandatory, callback) {
                callback(mandatory, false, "list", element, $(element).data('list-msg') || "Il servizio non è ancora attivo nella città inserita", $(element).data('list'));
            };

            response["literals"] = function (element, tagInfo, mandatory, callback) {
                callback(mandatory, false, "regex", element, $(element).data('literals-msg') || "Sono ammesse solo lettere", '^[a-zA-Z\ \']+$');
            };

            response["alphanumeric"] = function (element, tagInfo, mandatory, callback) {
                callback(mandatory, false, "regex", element, $(element).data('alphanumeric-msg') || "Sono ammesse solo lettere e cifre", '^[a-zA-Z0-9]+$');
            };

            response["number"] = function (element, tagInfo, mandatory, callback) {
                callback(mandatory, false, "regex", element, $(element).data('number-msg') || "Sono ammessi solo numeri", '^[0-9 ]+$');
            };

            response["minlength"] = function (element, tagInfo, mandatory, callback) {
                callback(mandatory, false, "minlength", element, $(element).data('minlength-msg') || "Il campo deve essere almeno di " + $(element).data('minlength-rule') + " caratteri.", $(element).data('minlength-rule'));
            };

            response["maxlength"] = function (element, tagInfo, mandatory, callback) {
                callback(mandatory, false, "maxlength", element, $(element).data('maxlength-msg') || "Il campo non può superare i " + $(element).data('maxlength-rule') + " caratteri.", $(element).data('maxlength-rule'));
            };

            response["email"] = function (element, tagInfo, mandatory, callback) {
                callback(mandatory, false, "regex", element, "Inserire un indirizzo email valido", '^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$');
            };

            return response;
        }()),
        getTagInfo = function (element) {
            return {
                elementLocalName: $(element).prop("localName"),
                elementType: $(element).attr("type")
            };
        },
        clearState = function (element) {
            $(element).find('.popover').remove();

            if ($('#message-alert').length) {
                $('#message-alert').remove();
            }

            $(element).find('.has-error').removeClass('has-error');

        },
        updateMessage = function (field, message) {
            var popover = {
                main: $('<div />', {class: "popover bottom", style: "display:block;"}),
                msg: $('<p />', {
                    class: "help-block",
                    text: message
                }),
                container: $('<div />', {class: "popover-content"}),
                arrow: $('<div />', {class: "arrow"})
            };

            field.after(popover.main.append(popover.container.append(popover.msg)).prepend(popover.arrow));

            popover.main.position({
                of: field,
                my: "left top",
                at: "left bottom",
                collision: "flip"
            });
        },
        removeOutlineMessage = function (field) {
            if (getAppendRoot(field)().find('.form-outline-error').length) {
                getAppendRoot(field)().find('.form-outline-error').remove();
            }
        },
        getAppendRoot = function(field) {
            var tagInfo = getTagInfo(field);

            return function(){
                if (getOptions(field).errorPlaceholder) {
                    return $(getOptions(field).errorPlaceholder);
                } else if (getOptions(field).errorAppendToForm) {
                    if (tagInfo.elementLocalName === 'form') {
                        return $(field);
                    } else {
                        return $(field).parents('form');
                    }
                } else {
                    if ($(field).parents('.form-group')){
                        return $(field).parents('.form-group');
                    } else {
                        return $(field).parent();
                    }
                }
            }
        },
        updateOutlineMessage = function (field, message) {
            var alertMessage = {
                    container: $('<div />', {
                        class: "form-outline-error"
                    }),
                    msg: $('<p />', {
                        class: "text-danger",
                        text: message
                    })
                };

            if (getAppendRoot(field)().find('.form-outline-error').length) {
                getAppendRoot(field)().find('.form-outline-error').remove();
            }

            getAppendRoot(field)().append(alertMessage.container.append(alertMessage.msg));

            propageEvent(field, 'error')
        },
        removeSingleMessage = function () {
            if ($("#message-alert").length) {
                $("#message-alert").remove();
            }
        },
        updateSingleMessage = function (field, message) {
            var popover = {
                    main: $('<div />', {
                        id: "message-alert",
                        class: "col-xs-16 col-sm-10 col-sm-offset-3" // alert alert-danger
                    }),
                    msg: $('<p />', {
                        class: "help-block",
                        text: message
                    }),
                    container: $('<div />', {
                        class: "alert-content"
                    })
                };

            if ($("#message-alert").length) {
                $("#message-alert").remove();
            }

            getAppendRoot(field)().append(popover.main.append(popover.container.append(popover.msg)));

            propageEvent(field, 'error')
        },
        updateGlobalStatus = function (field /*, message*/) {
            getInputs(field).each(function () {
                $(this).parents('.form-group').addClass(getOptions(field).errorCssClass);
            });

            //TODO: messageStrategy[getOptions(field[0]).errorType](field, message); è da attivare questo metodo o non serve??
        },
        updateStatus = function (field, message) {
            field.parents('.form-group').addClass(getOptions(field).errorCssClass);
            messageStrategy[getOptions(field[0]).errorType](field, message);

            if (getOptions(field).allowGlobal) {
                field.parents('form').addClass('error-' + field[0].name);
            }

            inputEvents(field, getOptions(field).allowGlobal);
        },
        checkRegexp = function (field, regexp, message) {
            regexp = new RegExp(regexp.toString(), "gi");

            if (!(regexp.test(field.val()))) {
                updateStatus(field, message);
                return false;
            }

            return true
        },
        checkInvalidChars = function (field, regexp, message) {
            var invalidChars = [],
                invalidCharacter;

            regexp = new RegExp(regexp, "gi");
            while ((invalidCharacter = regexp.exec(field.val())) !== null) {
                if (invalidCharacter.index === regexp.lastIndex) {
                    regexp.lastIndex++;
                }
                if ($.inArray(invalidCharacter.toString(), invalidChars) === -1) {
                    invalidChars.push(invalidCharacter.toString());
                }
            }
            if (invalidChars.length) {
                updateStatus(field, message + invalidChars.join(' '));
                return false;
            }
            return true;
        },
        checkList = function (field, list, message) {
            var value = $(field).val(),
                isValid = false;

            if (value !== "") {
                $.each(list, function (index, item) {
                    if (value.toLowerCase() === item.label.toLowerCase()) {
                        isValid = true;
                        return false;
                    }
                });
            }

            if (!isValid && value !== "") {
                clearState($(field).parents('form'));
                updateStatus($(field), message || "Il valore specificato non è tra quelli ammessi.");
            }
            return isValid;
        },
        checkSelectVal = function (field, message) {
            if (field.val().length) {
                return true;
            } else {
                updateStatus(field, message);
                return false;
            }
        },
        checkSelectOrNo = function (field, message) {
            if (field.is(':checked')) {
                return true;
            } else {
                updateStatus(field, message);
                return false;
            }
        },
        checkMaxLength = function (field, value, message) {
            if (field.val().length > value) {
                updateStatus(field, message);
                return false;
            } else {
                return true;
            }
        },
        checkMinLength = function (field, value, message) {
            if (field.val().length < value) {
                updateStatus(field, message);
                return false;
            } else {
                return true;
            }
        },
        getInputs = function (element) {
            return $(element).find("input[type!='hidden'], select, textarea");
        },
        unsetEvents = function (element) {
            $(element).off('keypress');
        },
        setEvents = function (element) {
            var parsedRules = $(element).data('validation'),
                validationRules = regexParser.exec(parsedRules),
                tagInfo = getTagInfo(element);

            if (tagInfo.elementLocalName === "input" || tagInfo.elementLocalName === "textarea") {
                $(element).on('keypress', function () {
                    eventStrategy[getOptions(element).errorType](this);
                });
            }

            if (!validationRules) {
                return false;
            }

            var str = validationRules[1],
                result = str.split(",");

            for (var i = 0, rule = result[i]; rule; i += 1, rule = result[i]) {
                rule = rule.trim();
                if (setEventsRules[rule]) {
                    setEventsRules[rule](element);
                }
            }
        },
        globalValidation = function (element) {
            var parsedRules = $(element).data('validation'),
                validationRules = regexParser.exec(parsedRules);

            if (!validationRules) {
                return true;
            }

            var str = validationRules[1],
                result = str.split(","),
                mandatory = false,
                isValidate = true,
                evaluateValidation = function (required, isValid, action, element, message, pattern) {
                    mandatory = required;

                    if (required) {
                        isValidate = isValidate && validateGlobalField[action](element, message, pattern);
                    } else {
                        isValidate = isValidate && isValid;
                    }
                };

            for (var i = 0, rule = result[i]; rule; i += 1, rule = result[i]) {
                rule = rule.trim();
                if (setGlobalValidationRules[rule]) {
                    setGlobalValidationRules[rule](element, mandatory, evaluateValidation);
                }
            }
            return isValidate;
        },
        inputEvents = function (element, global) {
            $(element).one('keypress', function () {
                $(this).parents('.form-group').removeClass(getOptions(element).errorCssClass);
                if (global) {
                    $(this).parents('form').removeClass('error-' + $(this)[0].name);
                }
                eventStrategy[getOptions(element).errorType](this);
            });
        },
        startForm = function(e, element, options) {
            if (options.allowGlobal) {
                $(element).data('validation-result', 'pass');
                //$(element).removeClass('has-error');
            }

            if (options.submitHandler) {
                options.submitHandler();
            }

            return true;
        },
        stopForm = function(e, element, options) {
            e.preventDefault();
            e.stopPropagation();

            if (options.allowGlobal) {
                $(element).data('validation-result', 'fail');
                //$(element).addClass('has-error');
            }

            return false;
        },
        loadValidation = function (element) {
            var parsedRules = $(element).data('validation'),
                validationRules = regexParser.exec(parsedRules);

            if (!validationRules) {
                return false;
            }

            var str = validationRules[1],
                result = str.split(","),
                tagInfo = getTagInfo(element),
                mandatory = false,
                isValidate = true,
                evaluateValidation = function (required, isValid, action, element, message, pattern) {
                    mandatory = required;

                    if (required) {
                        isValidate = isValidate && validateField[action](element, message, pattern);
                    } else {
                        isValidate = isValidate && isValid;
                    }
                };

            for (var i = 0, rule = result[i]; rule; i += 1, rule = result[i]) {
                rule = rule.trim();

                if (setValidationRules[rule]) {
                    setValidationRules[rule](element, tagInfo, mandatory, evaluateValidation);
                }
            }

            return isValidate;
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {
        init: function () {
            if ($(document)) {
                var that = this,
                    currentOptions = that.options,
                    element = that.element;

                $(element).addClass(currentOptions.formCssClass);

                if (currentOptions.realTime) {
                    getInputs(element).each(function () {
                        setEvents($(this));
                    });
                }

                $(element).on('submit', function (e) {
                    var isValid = true;

                    clearState(this);

                    if (currentOptions.allowGlobal) {
                        isValid = isValid && globalValidation(that);
                    }

                    if (isValid) {
                        getInputs(element).each(function () {
                            isValid = isValid && loadValidation($(this));

                            if (!isValid && currentOptions.oneError) {
                                $(this).focus();

                                return false;
                            }
                        });
                    }

                    if (!isValid) {
                        return stopForm(e, that.element, currentOptions);
                    }

                    return startForm(e, that.element, currentOptions);
                });
            }
        },
        validate: function (callback) {
            var isValid = true;
            clearState(this.element);
            getInputs(this.element).each(function () {
                var rule = loadValidation($(this));
                isValid = isValid && rule;
            });
            callback(isValid);
            return false;
        },
        destroy: function(){
            $(this.element).removeData();

            $(this.element).off('submit');

            if (this.options.realTime) {
                getInputs(this.element).each(function () {
                    unsetEvents($(this));
                });
            }
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, getPluginName())) {
                $.data(this, getPluginName(),
                    new Plugin(this, options));
            }
        });
    };
})(jQuery, window, document);

