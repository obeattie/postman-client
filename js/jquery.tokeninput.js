/*
 * jQuery Plugin: Tokenizing Autocomplete Text Entry
 * Version 1.1.1
 *
 * Copyright (c) 2009 James Smith (http://loopj.com)
 * Licensed jointly under the GPL and MIT licenses,
 * choose which one suits your project best!
 *
 */

(function($) {

    $.fn.tokenInput = function (options) {
        var settings = $.extend({
            hintText: "Type a friend's name...",
            showHint: false,
            noResultsText: "No results",
            createText: "Create",
            searchDelay: 0,
            filterResults: undefined,
            allowNewValues: false,
            initialValues: null,
            defaultOptions: null,
            minChars: 1,
            tokenLimit: null,
            jsonContainer: null,
            onResult: null,
            canCreate: false,
            forceLowerCase: false,
            createIdentifier: ""  // If using canCreate, this will prefix newly created tags
        }, options);

        settings.classes = $.extend({
            tokenList: "token-input-list-facebook",
            token: "token-input-token-facebook",
            tokenDelete: "token-input-delete-token-facebook",
            selectedToken: "token-input-selected-token-facebook",
            highlightedToken: "token-input-highlighted-token-facebook",
            dropdown: "token-input-dropdown-facebook",
            dropdownItem: "token-input-dropdown-item-facebook",
            dropdownItem2: "token-input-dropdown-item2-facebook",
            selectedDropdownItem: "token-input-selected-dropdown-item-facebook",
            inputToken: "token-input-input-token-facebook"
        }, options.classes);
    
        return this.each(function () {
            var list = new $.TokenList(this, settings);
        });
    };

    $.TokenList = function (input, settings) {
        //
        // Variables
        //

        // Input box position "enum"
        var POSITION = {
            BEFORE: 0,
            AFTER: 1,
            END: 2
        };

        // Keys "enum"
        var KEY = {
            BACKSPACE: 8,
            TAB: 9,
            RETURN: 13,
            ESC: 27,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            COMMA: 188
        };

        // Save the tokens
        var saved_tokens = [];
    
        // Keep track of the number of tokens in the list
        var token_count = 0;

        // Basic cache to save on db hits
        var cache = new $.TokenList.Cache();

        // Keep track of the timeout
        var timeout;

        var show_dropdown = false,
                hide_dropdown_timeout = null,
                show_dropdown_timeout = null;

        // Create a new text input and attach keyup events
        var input_box = $("<input type=\"text\">")
        .css({
            outline: "none"
        })
        .focus(function () {
            if (settings.tokenLimit == null || settings.tokenLimit != token_count) {
                window.clearTimeout(hide_dropdown_timeout);
                setTimeout(function(){ show_dropdown_hint(), 200 });
            }
        })
        .blur(function () {
            // If the user has been typing, create what they typed as a new value
            if(settings.allowNewValues) create_new_token();
            if(settings.defaultOptions) { hide_dropdown_timeout = setTimeout(function(){ hide_dropdown(); }, 200); }
            else { hide_dropdown(); }
        })
        .keydown(function (event) {
            var previous_token;
            var next_token;
            //alert(event.keyCode);

            switch(event.keyCode) {
                case KEY.LEFT:
                case KEY.RIGHT:
                case KEY.UP:
                case KEY.DOWN:
                    if(!$(this).val()) {
                        previous_token = input_token.prev();
                        next_token = input_token.next();

                        if((previous_token.length && previous_token.get(0) === selected_token) || (next_token.length && next_token.get(0) === selected_token)) {
                            // Check if there is a previous/next token and it is selected
                            if(event.keyCode == KEY.LEFT || event.keyCode == KEY.UP) {
                                deselect_token($(selected_token), POSITION.BEFORE);
                            } else {
                                deselect_token($(selected_token), POSITION.AFTER);
                            }
                        } else if((event.keyCode == KEY.LEFT || event.keyCode == KEY.UP) && previous_token.length) {
                            // We are moving left, select the previous token if it exists
                            select_token($(previous_token.get(0)));
                        } else if((event.keyCode == KEY.RIGHT || event.keyCode == KEY.DOWN) && next_token.length) {
                            // We are moving right, select the next token if it exists
                            select_token($(next_token.get(0)));
                        }
                    } else {
                        var dropdown_item = null;

                        if(event.keyCode == KEY.DOWN || event.keyCode == KEY.RIGHT) {
                            dropdown_item = $(selected_dropdown_item).next();
                        } else {
                            dropdown_item = $(selected_dropdown_item).prev();
                        }

                        if(dropdown_item.length) {
                            select_dropdown_item(dropdown_item);
                        }
                        return false;
                    }
                    break;

                case KEY.BACKSPACE:
                    previous_token = input_token.prev();

                    if(!$(this).val().length) {
                        if(selected_token) {
                            delete_token($(selected_token));
                        } else if(previous_token.length) {
                            select_token($(previous_token.get(0)));
                        }

                        return false;
                    } else if($(this).val().length == 1) {
                        hide_dropdown();
                    } else {
                        // set a timeout just long enough to let this function finish.
                        setTimeout(function(){
                            do_search(false);
                        }, 5);
                    }
                    break;

                case KEY.TAB:
                case KEY.RETURN:
                case KEY.COMMA:
                    if(selected_dropdown_item) {
                        add_token($(selected_dropdown_item));
                        return false;
                    } else if(settings.allowNewValues) {
                        create_new_token();
                        return false;
                    }
                    break;

                case KEY.ESC:
                    hide_dropdown();
                    return true;

                default:
                    if(is_printable_character(event.keyCode)) {
                        // set a timeout just long enough to let this function finish.
                        setTimeout(function(){
                            do_search(false);
                        }, 5);
                    }
                    break;
            }

            return true;
        });

        // Keep a reference to the original input box
        var hidden_input = $(input)
        .hide()
        .focus(function () {
            input_box.focus();
        })
        .blur(function () {
            input_box.blur();
        });

        // Keep a reference to the selected token and dropdown item
        var selected_token = null;
        var selected_dropdown_item = null;

        // The list to store the token items in
        var token_list = $("<ul />")
        .addClass(settings.classes.tokenList)
        .insertAfter(hidden_input)
        .click(function (event) {
            // var $t = $(event.currentTarget);
            // var li = $t.hasClass(settings.classes.tokenList) ? $(event.currentTarget).find("li:first") : get_element_from_event(event, "li");    
            var li = get_element_from_event(event, "li." + settings.classes.token);
            if(li && li.get(0) != input_token.get(0)) {
                toggle_select_token(li);
                return false;
            } else {
                input_box.focus();

                if(selected_token) {
                    deselect_token($(selected_token), POSITION.END);
                }
            }
            return true;
        })
        .mouseover(function (event) {
            var li = get_element_from_event(event, "li");
            if(li && selected_token !== this) {
                li.addClass(settings.classes.highlightedToken);
            }
        })
        .mouseout(function (event) {
            var li = get_element_from_event(event, "li");
            if(li && selected_token !== this) {
                li.removeClass(settings.classes.highlightedToken);
            }
        })
        .mousedown(function (event) {
            // Stop user selecting text on tokens
            var li = get_element_from_event(event, "li");
            if(li){
                return false;
            }
            return true;
        });


        // The list to store the dropdown items in
        var dropdown = $("<div>")
        .addClass(settings.classes.dropdown)
        .insertAfter(token_list)
        .hide();

        // The token holding the input box
        var input_token = $("<li />")
        .addClass(settings.classes.inputToken)
        .appendTo(token_list)
        .append(input_box);

        init_list();

        //
        // Functions
        //

        // Pre-populate list if items exist
        function init_list () {
            if(settings.initialValues) {
                hidden_input.val('');
                $.each(settings.initialValues, function() {
                    create_token(this);
                });
            } else {
                hidden_input.val('');
            }
        }

        function init_default_options() {
            if(settings.defaultOptions) {
                populate_dropdown("", settings.defaultOptions);
            }
        }

        function is_printable_character(keycode) {
            if((keycode >= 48 && keycode <= 90) ||      // 0-1a-z
                (keycode >= 96 && keycode <= 111) ||     // numpad 0-9 + - / * .
                (keycode >= 186 && keycode <= 192) ||    // ; = , - . / ^
                (keycode >= 219 && keycode <= 222)       // ( \ ) '
                ) {
                return true;
            } else {
                return false;
            }
        }

        // Get an element of a particular type from an event (click/mouseover etc)
        function get_element_from_event (event, element_type) {
            var target = $(event.target);
            var element = null;
            if(target.is(element_type)) {
                element = target;
            } else if(target.parent(element_type).length) {
                element = target.parent(element_type+":first");
            }

            return element;
        }

        // Inner function to a token to the list
        function insert_token(id, value) {
            var this_token = $("<li><p>"+ value +"</p> </li>")
            .addClass(settings.classes.token)
            .insertBefore(input_token);

            // The 'delete token' button
            $("<span>x</span>")
            .addClass(settings.classes.tokenDelete)
            .appendTo(this_token)
            .click(function () {
                delete_token($(this).parent());
                return false;
            });

            $.data(this_token.get(0), "tokeninput", {
                "id": id,
                "name": value
            });

            return this_token;
        }

        // Add a token to the token list based on user input
        function add_token (item) {
            var li_data = $.data(item.get(0), "tokeninput");
            create_token(li_data);
        }
    
        function create_token (li_data) {
            var this_token = insert_token(li_data.id, li_data.name);

            // Clear input box and make sure it keeps focus
            input_box
            .val("")
            .focus();

            // Don't show the help dropdown, they've got the idea
            hide_dropdown();

            // Save this token id
            //var id_string = li_data[i].id + ","
            var current_value = hidden_input.val();
            current_value = (current_value == "") ? current_value : (current_value+",")
            hidden_input.val(current_value + li_data.id);

        
            token_count++;
        
            if(settings.tokenLimit != null && settings.tokenLimit >= token_count) {
                input_box.hide();
                hide_dropdown();
            }

            $(hidden_input).trigger('tokenadd', {
                update: update_token,
                remove: delete_token,
                data: li_data,
                token: this_token.get(0)
            });
        }
    
        function update_token (item, data) {
            var old_data = $.data(item, "tokeninput");
            var new_data = {
                id: data.id == undefined ? old_data.id : data.id,
                name: data.name == undefined ? old_data.name : data.name
            };
        
            $.data(item, "tokeninput", data);
        
            var old_id_string = old_data.id + ",";
            var new_id_string = new_data.id + ",";
        
            hidden_input.val(
                hidden_input.val().replace(old_id_string, new_id_string)
                );
        }
    
        function create_new_token () {
            return;
            var string = input_box.val().toLowerCase();
            if(string.length > 0) {
                var this_token = $("<li><p>"+string+"</p> </li>")
                .addClass(settings.classes.token)
                .insertBefore(input_token);

                $("<span>x</span>")
                .addClass(settings.classes.tokenDelete)
                .appendTo(this_token)
                .click(function () {
                    delete_token($(this).parent());
                    return false;
                });
                add_token(this_token);
            }
        }

        // Select a token in the token list
        function select_token (token) {
            token.addClass(settings.classes.selectedToken);
            selected_token = token.get(0);

            // Hide input box
            input_box.val("");

            // Hide dropdown if it is visible (eg if we clicked to select token)
            hide_dropdown();
        }

        // Deselect a token in the token list
        function deselect_token (token, position) {
            token.removeClass(settings.classes.selectedToken);
            selected_token = null;

            if(position == POSITION.BEFORE) {
                input_token.insertBefore(token);
            } else if(position == POSITION.AFTER) {
                input_token.insertAfter(token);
            } else {
                input_token.appendTo(token_list);
            }

            // Show the input box and give it focus again
            input_box.focus();
        }

        // Toggle selection of a token in the token list
        function toggle_select_token (token) {
            if(selected_token == token.get(0)) {
                deselect_token(token, POSITION.END);
            } else {
                if(selected_token) {
                    deselect_token($(selected_token), POSITION.END);
                }
                select_token(token);
            }
        }

        // Delete a token from the token list
        function delete_token (token) {
            // Remove the id from the saved list
            var token_data = $.data(token.get(0), "tokeninput");

            // Delete the token
            token.remove();
            selected_token = null;

            // Show the input box and give it focus again
            input_box.focus();

            // Delete this token's id from hidden input
            var tokens = hidden_input.val().split(",");
            var to_delete = tokens.indexOf(token_data.id);
            tokens.splice(to_delete, 1);
            hidden_input.val(tokens.join(","));

            token_count--;
        
            if (settings.tokenLimit != null) {
                input_box
                .show()
                .val("")
                .focus();
            }

            $(hidden_input).trigger('tokendelete', {
                add: create_token,
                data: token_data
            });
        }

        // Hide and clear the results dropdown
        function hide_dropdown () {
            if(!show_dropdown) {
                dropdown.hide().empty();
                selected_dropdown_item = null;
            } else { 
                show_dropdown = false
            }
        }

        function show_dropdown_hint () {
            if (settings.showHint){
                dropdown
                .html("<p>"+settings.hintText+"</p>")
                .show();
            } else {
                dropdown.hide();
            }
            if(settings.defaultOptions) {
                dropdown.find("a.defaultOptions").click(function(event) {
                    show_dropdown = true;
                    populate_dropdown("", settings.defaultOptions);
                });
            }
        }

        // Highlight the query part of the search term
        function highlight_term(value, term) {
            return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<b>$1</b>");
        }

        // Populate the results dropdown with some results
        function populate_dropdown(query, results) {
            if(results.length || settings.canCreate) {
                dropdown.empty();
                var dropdown_ul = $("<ul>")
                .appendTo(dropdown)
                .mouseover(function (event) {
                    select_dropdown_item(get_element_from_event(event, "li"));
                })
                .click(function (event) {
                    //var item = get_element_from_event(event, "li");
                    //var the_data = $.data(item.get(0), "tokeninput");
                    //add_token(the_data.id, the_data.name);
                    add_token(get_element_from_event(event, "li"));
                })
                .mousedown(function (event) {
                    // Stop user selecting text on tokens
                    add_token(get_element_from_event(event, "li"));
                    return false;
                })
                .hide();

                // Check for duplicates
                var resultAdded = new Array();
                $("." + settings.classes.token, token_list)
                .each(function(i, val) {
                    var data = $.data(val, "tokeninput");
                    resultAdded[data.name] = 1;
                }
                );
            
                // Save the first li for selecting
                var firstLi;

                for(var i in results) {
                    if (results.hasOwnProperty(i) && !resultAdded[results[i].name]) {
                        var this_li = $("<li>"+highlight_term(results[i].name, query)+"</li>")
                        .appendTo(dropdown_ul);

                        if(i%2) {
                            this_li.addClass(settings.classes.dropdownItem);
                        } else {
                            this_li.addClass(settings.classes.dropdownItem2);
                        }

                        if(i == 0) {
                            firstLi = this_li;
                        }
                    
                        resultAdded[results[i].name] = 1;
                        $.data(this_li.get(0), "tokeninput", {
                            "id": results[i].id,
                            "name": results[i].name
                            });
                    }
                }
            
                // If canCreate option enabled, show "Create 'token-name'"
                if(settings.canCreate && !resultAdded[query]) {
                    var li = $("<li>" + settings.createText + " '" + query + "'</li>")
                    .appendTo(dropdown_ul);
                    // li.addClass(results.length%2 ? settings.classes.dropdownItem : settings.classes.dropdownItem2);
                    if(results.length % 2) {
                        li.addClass(settings.classes.dropdownItem);
                    } else {
                        li.addClass(settings.classes.dropdownItem2);
                    }
                
                    if(results.length == 0) {
                        firstLi = li;
                    }
                
                    $.data(li.get(0), "tokeninput", {
                        "id": settings.createIdentifier + query,
                        "name": query
                    });
                }
                if(firstLi) {
                    select_dropdown_item(firstLi);
                }

                dropdown.show();
                dropdown_ul.show();

            } else {
                if(settings.noResultsText.length > 0) {
                    dropdown
                    .html("<p>"+settings.noResultsText+"</p>")
                    .show();
                    if(settings.defaultOptions) {
                        dropdown.find("a.defaultOptions").click(function(event) {
                            show_dropdown = true;
                            populate_dropdown("", settings.defaultOptions);
                        });
                    }
                } else {
                    hide_dropdown();
                }
            }
        }

        // Highlight an item in the results dropdown
        function select_dropdown_item (item) {
            if(item) {
                if(selected_dropdown_item) {
                    deselect_dropdown_item($(selected_dropdown_item));
                }

                item.addClass(settings.classes.selectedDropdownItem);
                selected_dropdown_item = item.get(0);
            }
        }

        // Remove highlighting from an item in the results dropdown
        function deselect_dropdown_item (item) {
            item.removeClass(settings.classes.selectedDropdownItem);
            selected_dropdown_item = null;
        }

        // Do a search and show the "searching" dropdown if the input is longer
        // than settings.minChars
        function do_search(immediate) {
            var query = input_box.val();
            
            if(settings.forceLowerCase) {
                query = query.toLowerCase();
            }

            if (query && query.length) {
                if(selected_token) {
                    deselect_token($(selected_token), POSITION.AFTER);
                }
                if (query.length >= settings.minChars) {
                    if (immediate) {
                        run_search(query);
                    } else {
                        clearTimeout(timeout);
                        timeout = setTimeout(function(){
                            run_search(query);
                        }, settings.searchDelay);
                    }
                } else {
                    hide_dropdown();
                }
            }
        }

        // Do the actual search
        function run_search(query) {
            var cached_results = cache.get(query);
            if(cached_results) {
                populate_dropdown(query, cached_results);
            } else {
                var callback = function(results) {
                    if($.isFunction(settings.onResult)) {
                        results = settings.onResult.call(this, results);
                    }
                    cache.add(query, settings.jsonContainer ? results[settings.jsonContainer] : results);
                    populate_dropdown(query, settings.jsonContainer ? results[settings.jsonContainer] : results);
                };
                
                settings.filterResults(query, callback);
            }
        }
    };

    // Really basic cache for the results
    $.TokenList.Cache = function (options) {
        var settings = $.extend({
            max_size: 50,
            
        }, options);

        var data = {};
        var size = 0;

        var flush = function () {
            data = {};
            size = 0;
        };

        this.add = function (query, results) {
            if(size > settings.max_size) {
                flush();
            }

            if(!data[query]) {
                size++;
            }

            data[query] = results;
        };

        this.get = function (query) {
            return data[query];
        };
    };

})(jQuery);
