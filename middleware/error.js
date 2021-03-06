'use strict';

/**
 * Обработчик ошибок VK API
 *
 * @param object error   Объект ошибки
 * @param object request Данные запроса
 *
 * @return ApiError
 */
exports._apiError = function(errorVk,request){
	var error = new this.ApiError(errorVk);

	if (!(error.code in this._apiErrorList)) {
		if (request[0] === 'messages.send') {
			--this.status.messages;
		}

		this.logger.error('Api error №'+error.code,error.message);

		request[3](error);

		return error;
	}

	this._apiErrorList[error.code].call(this,errorVk,request);

	return error;
};

/* Обработчики ошибок VK API */
exports._apiErrorList = {
	/**
	 * Превышен лимит запросов в секунду
	 */
	6: function(error,request){
		this._apiRestart(request);
	},
	/**
	 * Обработка капчи
	 */
	14: function(error,request){
		if (!this._captchaHandler) {
			return this.logger.warn('Captcha needed!');
		}

		this._captchaHandler(error.captcha_img,(code) => {
			return new this.promise((resolve,reject) => {
				request[1].captcha_sid = error.captcha_sid;
				request[1].captcha_key = code;

				request[4] = {
					resolve: resolve,
					reject: reject
				};

				this._apiRestart(request);
			});
		});
	}
};
