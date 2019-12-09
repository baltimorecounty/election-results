var ElectionAjaxService = (function($, ElectionParams) {
  return {
    ajax: function(ajaxProps) {
      $.ajax({
        contentType: "application/json",
        crossDomain: true,
        data: {},
        dataType: "json",
        type: "GET",
        url: ElectionParams.serviceUrl,
        success: function(data, textStatus, jqXHR) {
          if (ajaxProps.success && typeof ajaxProps.success === "function")
            ajaxProps.success(data, textStatus, jqXHR);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          if (ajaxProps.error && typeof ajaxProps.error === "function")
            ajaxProps.error(jqXHR, textStatus, errorThrown);
        },
        complete: function(jqXHR, textStatus) {
          if (ajaxProps.complete && typeof ajaxProps.complete === "function")
            ajaxProps.complete(jqXHR, textStatus);
        }
      });
    }
  };
})(jQuery, ElectionParams);
