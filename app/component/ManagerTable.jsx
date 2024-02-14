import React from "react";
import moment from "moment";

const calculateDaysBetween = (start, end) => {
  const startDate = moment(start);
  const endDate = moment(end);
  return endDate.diff(startDate, "days") + 1; // Including both start and end days
};

const processData = (data) => {
  const summary = {};

  data.forEach((item) => {
    const { name, propertyValues } = item;
    // Initialize or retrieve existing summary for the person
    if (!summary[name]) {
      summary[name] = { usedDays: 0, requestedDays: 0, leftDays: 25 }; // Assume 25 days initially available
    }

    // Find status value once for the current item
    const statusValue = propertyValues.find((p) => p.definition.id === 12888200)?.value;

    // Find the start and end dates only if status is Approved or Requested to avoid unnecessary processing
    if (statusValue === "Approved" || statusValue === "Requested") {
      const startDateValue = propertyValues.find((p) => p.definition.id === 12673261)?.value;
      const endDateValue = propertyValues.find((p) => p.definition.id === 12673262)?.value;

      if (startDateValue && endDateValue) {
        const daysBetween = calculateDaysBetween(startDateValue, endDateValue);

        if (statusValue === "Approved") {
          summary[name].usedDays += daysBetween;
        } else if (statusValue === "Requested") {
          summary[name].requestedDays += daysBetween;
        }

        // Adjust leftDays only for approved days
        if (statusValue === "Approved") {
          summary[name].leftDays -= daysBetween;
        }
      }
    }
  });

  // Convert the summary object back into an array for rendering
  return Object.entries(summary).map(([name, details]) => ({
    name,
    ...details,
  }));
};

const VacationTable = ({ data }) => {
  if (!data) {
    return null;
  }

  console.log(data);

  const filteredData = data.filter((item) => item.type.id === 12678202);
  const processedData = processData(filteredData);

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full table-auto text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 ">
          <tr>
            <th scope="col" className="py-3 px-6">
              Name
            </th>
            <th scope="col" className="py-3 px-6">
              Vacation Days Used
            </th>
            <th scope="col" className="py-3 px-6">
              Requested Days
            </th>
            <th scope="col" className="py-3 px-6">
              Vacation Days Left
            </th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((user, index) => (
            <tr key={index} className="bg-white border-b">
              <td className="py-4 px-6 font-medium text-gray-900 whitespace-nowrap ">{user.name}</td>
              <td className="py-4 px-6">{user.usedDays}</td>
              <td className="py-4 px-6">{user.requestedDays}</td>
              <td className="py-4 px-6">{user.leftDays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VacationTable;
