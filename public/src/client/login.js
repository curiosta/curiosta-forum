'use strict';


define('forum/login', ['translator', 'jquery-form'], function (translator) {
	var	Login = {
		_capsState: false,
	};

	Login.init = function () {
		var errorEl = $('#login-error-notify');
		var submitEl = $('#login');
		var formEl = $('#login-form');

		submitEl.on('click', function (e) {
			e.preventDefault();

			if (!$('#username').val() || !$('#password').val()) {
				errorEl.find('p').translateText('[[error:invalid-username-or-password]]');
				errorEl.show();
			} else {
				errorEl.hide();

				if (submitEl.hasClass('disabled')) {
					return;
				}

				submitEl.addClass('disabled');

				$(window).trigger('action:app.login');
				formEl.ajaxSubmit({
					headers: {
						'x-csrf-token': config.csrf_token,
					},
					beforeSend: function () {
						app.flags._login = true;
					},
					success: function (data) {
						$(window).trigger('action:app.loggedIn', data);
						var pathname = utils.urlToLocation(data.next).pathname;
						var params = utils.params({ url: data.next });
						params.loggedin = true;
						var qs = decodeURIComponent($.param(params));

						window.location.href = pathname + '?' + qs;
					},
					error: function (data) {
						var message = data.responseText;
						var errInfo = data.responseJSON;
						if (data.status === 403 && data.responseText === 'Forbidden') {
							window.location.href = config.relative_path + '/login?error=csrf-invalid';
						} else if (errInfo && errInfo.hasOwnProperty('banned_until')) {
							message = errInfo.banned_until ?
								translator.compile('error:user-banned-reason-until', (new Date(errInfo.banned_until).toLocaleString()), errInfo.reason) :
								'[[error:user-banned-reason, ' + errInfo.reason + ']]';
						}
						errorEl.find('p').translateText(message);
						errorEl.show();
						submitEl.removeClass('disabled');

						// Select the entire password if that field has focus
						if ($('#password:focus').length) {
							$('#password').select();
						}
					},
				});
			}
		});

		// Guard against caps lock
		Login.capsLockCheck(document.querySelector('#password'), document.querySelector('#caps-lock-warning'));

		$('#login-error-notify button').on('click', function (e) {
			e.preventDefault();
			errorEl.hide();
			return false;
		});

		if ($('#content #username').val()) {
			$('#content #password').val('').focus();
		} else {
			$('#content #username').focus();
		}
		$('#content #noscript').val('false');
	};

	Login.capsLockCheck = (inputEl, warningEl) => {
		const toggle = (state) => {
			warningEl.classList[state ? 'remove' : 'add']('hidden');
			warningEl.parentNode.classList[state ? 'add' : 'remove']('has-warning');
		};
		if (!inputEl) {
			return;
		}
		inputEl.addEventListener('keyup', function (e) {
			if (Login._capsState && e.key === 'CapsLock') {
				toggle(false);
				Login._capsState = !Login._capsState;
				return;
			}
			Login._capsState = e.getModifierState && e.getModifierState('CapsLock');
			toggle(Login._capsState);
		});

		if (Login._capsState) {
			toggle(true);
		}
	};

	return Login;
});
