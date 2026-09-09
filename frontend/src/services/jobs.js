import api from "../utils/api";


export async function getJobSummary() {

  const response = await api.get(
    "/jobs/summary/"
  );

  return response.data;

}


export async function getJobs({
  page = 1,
  status = "",
  search = "",
} = {}) {

  const params = {
    page,
  };


  if (status) {

    params.status = status;

  }


  if (search) {

    params.search = search;

  }


  const response = await api.get(
    "/jobs/",
    {
      params,
    }
  );


  return response.data;

}


export async function getJobById(
  jobId
) {

  const response = await api.get(
    `/jobs/${jobId}/`
  );

  return response.data;

}