import { getApiUrl, getAuthHeaders, readResponse, getErrorMessage } from "../../../services/apiHelper";
const root = `${getApiUrl()}/admin/student-card-verifications`;
async function call(url, options={}) { const response=await fetch(url,{...options,headers:{...getAuthHeaders(),...(options.headers||{})}});const data=await readResponse(response);if(!response.ok)throw new Error(getErrorMessage(data,"Có lỗi xảy ra."));return data; }
export const listVerifications = params => call(`${root}?${new URLSearchParams(params)}`);
export const getVerification = id => call(`${root}/${id}`);
export const approveVerification = id => call(`${root}/${id}/approve`,{method:"PATCH"});
export const rejectVerification = (id,reason) => call(`${root}/${id}/reject`,{method:"PATCH",body:JSON.stringify({reason})});
export async function getVerificationImage(id){const response=await fetch(`${root}/${id}/image`,{headers:getAuthHeaders()});if(!response.ok)throw new Error("Không thể tải ảnh thẻ.");return URL.createObjectURL(await response.blob());}
