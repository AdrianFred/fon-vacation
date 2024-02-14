import React from "react";
import moment from "moment-timezone";
import "moment/locale/nb";
import "moment-timezone";

// Function to calculate total vacation days used
export default function VacationSummary({ events }) {
  if (!events) {
    return null;
  }

  // Filter for upcoming and ongoing vacations
  const upcomingAndOngoingVacations = events.filter((event) => {
    const start = moment(event.start);
    const end = moment(event.end);
    const today = moment();
    return (start.isSameOrAfter(today, "day") || end.isSameOrAfter(today, "day")) && (event.status === "Approved" || event.status === "Requested");
  });

  const calculateVacationDaysUsed = () => {
    const currentYear = moment().year();
    return events.reduce((total, event) => {
      if (event.status === "Approved" && moment(event.start).year() === currentYear) {
        // Adding 1 to include the end date in the count
        const days = moment(event.end).diff(moment(event.start), "days") + 1;
        return total + days;
      }
      return total;
    }, 0);
  };

  const calculateVacationDaysRequested = () => {
    const currentYear = moment().year();
    return events.reduce((total, event) => {
      if (event.status === "Requested" && moment(event.start).year() === currentYear) {
        // Adding 1 to include the end date in the count
        const days = moment(event.end).diff(moment(event.start), "days") + 1;
        return total + days;
      }
      return total;
    }, 0);
  };

  const calculateTotalVacationDays = () => {
    return calculateVacationDaysUsed() + calculateVacationDaysRequested();
  };

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-2xl leading-6 font-medium text-gray-900">Vacation Summary</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">Details of your vacation plans.</p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="divide-y divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 ml-4">Total Vacation Days Approved This Year</dt>
            <dd className="mt-1 text-sm text-gray-900 ml-4 sm:ml-0 sm:mt-0 sm:col-span-2">{calculateVacationDaysUsed()}/25 days</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 ml-4">Total Vacation Days Requested This Year</dt>
            <dd className="mt-1 text-sm text-gray-900 ml-4 sm:ml-0 sm:mt-0 sm:col-span-2">{calculateVacationDaysRequested()}/25 days</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 ml-4">Total Vacation Days This Year (Approved and Requested)</dt>
            <dd className="mt-1 text-sm text-gray-900 ml-4 sm:ml-0 sm:mt-0 sm:col-span-2">{calculateTotalVacationDays()}/25 days</dd>
          </div>
          <div className="py-4 mr- 4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 ml-4">Upcoming and Ongoing Vacations</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <ul className="border border-gray-200 rounded-md divide-y divide-gray-200 mr-4">
                {upcomingAndOngoingVacations.map((vacation, index) => (
                  <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                    <div className="w-0 flex-1 flex items-center">
                      <span className="flex-1 w-0 truncate">
                        {moment(vacation.start).format("LL")} - {moment(vacation.end).format("LL")}
                      </span>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${vacation.color}-100 text-${vacation.color}-800`}
                      >
                        {vacation.status}
                      </span>
                    </div>
                    {vacation.comment && (
                      <div className="ml-4 flex-shrink-0 flex items-center text-sm text-gray-500">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H7.414A2 2 0 006 17.414l-4-4A2 2 0 012 11V5z" />
                        </svg>
                        {vacation.comment}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
