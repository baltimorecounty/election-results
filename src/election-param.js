import { Config } from "@baltimorecounty/javascript-utilities";
const { getValue, setConfig } = Config;
const configValues = {
  local: {
    dataUrl: "https://develectionresults.baltimorecountymd.gov/data"
  },
  development: {
    dataUrl: "https://develectionresults.baltimorecountymd.gov/data"
  },
  staging: {
    dataUrl: "https://develectionresults.baltimorecountymd.gov/data"
  },
  production: {
    dataUrl: "https://electionresults.baltimorecountymd.gov/data"
  }
};
setConfig(configValues);

window.ElectionParams = (function() {
  return {
    serviceUrl: getValue("dataUrl"),
    refreshPoll: 30000
  };
})();
