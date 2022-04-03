const handleAxiosErrors = (error) => {
  console.log("ERROR!");
  if (error.response) {
    console.log("Server responded");
    // Request made and server responded
    console.log(error.response.data);
    console.log(error.response.status);
    console.log(error.response.headers);
  } else if (error.request) {
    console.log("No response");
    // The request was made but no response was received
    console.log(error.request);
  } else {
    console.log("Error setting up request");
    // Something happened in setting up the request that triggered an Error
    console.log("Error", error.message);
  }
};

export default handleAxiosErrors;
