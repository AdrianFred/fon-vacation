"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import toast from "react-hot-toast";
import moment from "moment-timezone";
import "moment/locale/nb";
import "moment-timezone";

export default function Home() {
  // Example events data
  const [events, setEvents] = useState([]);
  const [userId, setUserId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [myUser, setMyUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);

  const [activeView, setActiveView] = useState("Calendar");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState({ start: "", end: "" });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [clickedEvent, setClickedEvent] = useState(null);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [comment, setComment] = useState("");

  const [projectList, setProjectList] = useState({});
  const [itemTypeId, setItemTypeId] = useState({ absence: 12678202, personnelCard: 12678205 });
  const calendarRef = useRef(null);

  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [approvalEvent, setApprovalEvent] = useState(null);

  //Manager view
  const [allVacations, setAllVacations] = useState([]);

  moment.locale("nb");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const user = params.get("user");
    const token = params.get("token");
    if (user && token) {
      setUserId(user);
      setAccessToken(token);
    }
  }, []);

  useEffect(() => {
    if (userId && accessToken) {
      fetch("https://e2e-tm-prod-services.nsg-e2e.com/api/users/me?ignoreErrors=true", {
        method: "GET",
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
          "ocp-apim-subscription-key": "",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser(data);
          if (data.groupList?.map((group) => group.displayName).includes("Managers")) {
            setIsManager(true);
          }
        })
        .catch((err) => console.error(err));
    }

    // Fetch projects id
    if (accessToken) {
      fetch("https://e2e-tm-prod-services.nsg-e2e.com/api/projects?size=500&view=dropdown", {
        method: "GET",
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
          "ocp-apim-subscription-key": "l0avumqlod0ovdgq8dsfok53rb19e8q1",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("projects", data);
          if (data) {
            data.map((project) => {
              setProjectList((prev) => ({ ...prev, [project.name]: project.id }));
            });
          }
        })
        .catch((err) => console.error(err));
    }
  }, [userId, accessToken]);
  console.log("projectList", projectList);

  useEffect(() => {
    if (user) {
      fetch("https://e2e-tm-prod-services.nsg-e2e.com/api/items/search?size=1000&page=0", {
        method: "POST",
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
          "ocp-apim-subscription-key": "",
        },
        body: JSON.stringify({
          filter: {
            _type: "operation",
            dataType: "FILTER",
            operand1: {
              _type: "operation",
              dataType: "NUMERIC",
              operand1: {
                _type: "field",
                field: "ITEM_TYPE_ID",
              },
              operand2: {
                _type: "value",
                dataType: "NUMERIC",
                text: "12678205",
              },
              operator: "EQ",
            },
            operand2: {
              _type: "operation",
              dataType: "BOOLEAN",
              operand1: {
                _type: "field",
                field: "DELETED",
              },
              operand2: {
                _type: "value",
                dataType: "BOOLEAN",
                text: "false",
              },
              operator: "EQ",
            },
            operator: "AND",
          },
          ordering: [
            {
              _type: "field",
              orderDirection: "DESC",
              orderPosition: 1,
              field: "ITEM_ID",
            },
          ],
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            // Filter the users based on the condition
            const filteredUsers = data.filter((user) => {
              const definitionId = 12673273; // Define the definition ID
              // Check if user.propertyValues has definitionId and the value matches the userId
              const matchingProperty = user.propertyValues.find((property) => property.definitionId === definitionId && property.value === userId);
              return matchingProperty !== undefined;
            });
            setMyUser(filteredUsers);
            setAllUsers(data);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [user]);

  useEffect(() => {
    //fetch events from linked items
    if (myUser) {
      fetch(`https://e2e-tm-prod-services.nsg-e2e.com/api/items/list/ItemLinks/${myUser[0].id}?filter=0`, {
        method: "GET",
        headers: {
          Authorization: accessToken,
          "Content-Type": "application/json",
          "ocp-apim-subscription-key": "",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            // Filter the events based on the condition
            const filteredEvents = data.childItems
              .filter((event) => event.type.id === itemTypeId.absence)
              .map((event) => {
                const statusProperty = event.propertyValues.find((property) => property.definition.id === 12888200);
                let statusValue = statusProperty ? statusProperty.value : "Unknown";

                let color;
                switch (
                  statusValue.toLowerCase() // Case-insensitive matching
                ) {
                  case "rejected":
                    color = "red";
                    break;
                  case "approved":
                    color = "green";
                    break;
                  case "requested":
                    color = "orange";
                    break;
                  default:
                    console.log(`Unhandled status: ${statusValue}`);
                    color = "grey"; // Fallback color
                    break;
                }
                return {
                  id: event.id,
                  title: statusValue + " vacation",
                  start: event.propertyValues.find((property) => property.definition.id === 12673261).value,
                  end: event.propertyValues.find((property) => property.definition.id === 12673262).value,
                  color: color, // Add the color property here
                  status: statusValue, // For debugging
                  comment: event.propertyValues.find((property) => property.definition.id === 12673263).value,
                  allDay: true,
                };
              });
            setEvents(filteredEvents);
            console.log("filtered events with color and status", filteredEvents);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [myUser]);

  // Manager View Calls

  const managedUsers = allUsers.filter((user) => {
    const definitionId = 12886899; // Define the definition ID
    // Check if user.propertyValues has definitionId and the value matches the userId
    const matchingProperty = user.propertyValues.find((property) => property.definitionId === definitionId && property.value === userId);
    return matchingProperty !== undefined;
  });

  console.log("managedUsers", managedUsers);

  // Make a call and get linked items for all managedUsers and it has to be all the managedUsers Id

  useEffect(() => {
    if (isManager) {
      managedUsers.map((user) => {
        fetch(`https://e2e-tm-prod-services.nsg-e2e.com/api/items/list/ItemLinks/${user.id}?filter=0`, {
          method: "GET",
          headers: {
            Authorization: accessToken,
            "Content-Type": "application/json",
            "ocp-apim-subscription-key": "",
          },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data) {
              // Filter the events based on the condition
              const filteredEvents = data.childItems
                .filter((event) => event.type.id === itemTypeId.absence)
                .map((event) => {
                  const statusProperty = event.propertyValues.find((property) => property.definition.id === 12888200);
                  let statusValue = statusProperty ? statusProperty.value : "Unknown";

                  let color;
                  switch (
                    statusValue.toLowerCase() // Case-insensitive matching
                  ) {
                    case "rejected":
                      color = "red";
                      break;
                    case "approved":
                      color = "green";
                      break;
                    case "requested":
                      color = "orange";
                      break;
                    default:
                      console.log(`Unhandled status: ${statusValue}`);
                      color = "grey"; // Fallback color
                      break;
                  }
                  return {
                    id: event.id,
                    title: event.name,
                    start: event.propertyValues.find((property) => property.definition.id === 12673261).value,
                    end: event.propertyValues.find((property) => property.definition.id === 12673262).value,
                    color: color, // Add the color property here
                    status: statusValue, // For debugging
                    comment: event.propertyValues.find((property) => property.definition.id === 12673263).value,
                    allDay: true,
                  };
                });
              setAllVacations((prev) => [...prev, ...filteredEvents]);
              console.log("filtered events with color and status", filteredEvents);
            }
          })
          .catch((err) => console.error(err));
      });
    }
  }, [allUsers]);

  // Update the property with the property Api
  const handleManagerAccept = (id, status, comment) => {
    fetch(`https://e2e-tm-prod-services.nsg-e2e.com/api/items/properties?notify=true`, {
      method: "PUT",
      headers: {
        Authorization: accessToken,
        "Content-Type": "application/json",
        "ocp-apim-subscription-key": "",
      },
      body: JSON.stringify([
        {
          itemId: id,
          propertyValues: [
            {
              definition: {
                id: 12888200,
                name: "Status",
              },
              value: status,
            },
            {
              definition: {
                id: 12673263,
                name: "Comment",
              },
              value: comment,
            },
          ],
        },
      ]),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to send the request.");
        }
        return response.json();
      })
      .then((data) => {
        toast.success("Request has been updated successfully");

        // Assuming `calendarRef` is a ref to your FullCalendar component
        const calendarApi = calendarRef.current.getApi();
        const event = calendarApi.getEventById(id);

        if (event) {
          // Update event properties based on the approval/rejection
          event.setProp("title", `${status} vacation`); // Or any other title logic
          event.setExtendedProp("comment", comment); // Assuming you store comments in extended props
          event.setProp("color", status === "Approved" ? "green" : "red"); // Example color logic

          // Optionally, if you have a status property
          event.setExtendedProp("status", status);
        }

        setApprovalModalVisible(false);
        setApprovalEvent(null);
      })
      .catch((error) => {
        console.error("Error sending the request:", error);
        toast.error("Failed to update the request");
      });
  };

  const toggleView = () => {
    setActiveView(activeView === "Calendar" ? "Manager" : "Calendar");
  };

  const handleSelect = (arg) => {
    // Format start and end dates using moment-timezone
    const formattedStartDate = moment.tz(arg.startStr, "Europe/Oslo").format("YYYY-MM-DDTHH:mm:ssZZ");
    const formattedEndDate = moment.tz(arg.endStr, "Europe/Oslo").format("YYYY-MM-DDTHH:mm:ssZZ");

    setSelectedDate({ start: formattedStartDate, end: formattedEndDate });
    setModalVisible(true);
  };

  console.log("myUser", myUser);

  const handleSend = () => {
    // Send the POST request
    fetch("https://e2e-tm-prod-services.nsg-e2e.com/api/items?amount=1", {
      method: "POST",
      headers: {
        Authorization: accessToken,
        "Content-Type": "application/json",
        "ocp-apim-subscription-key": "",
      },
      body: JSON.stringify({
        name: myUser[0].name,
        id: null,
        typeId: itemTypeId.absence,
        project: {
          id: projectList.Føn,
        },
        amount: 1,
        propertyValues: [
          {
            definition: {
              id: 12673260,
              name: "Type",
              order: 0,
              propertyType: "LIST",
            },
            value: "Ferie",
          },
          {
            definition: {
              id: 12673261,
              name: "From",
              order: 1,
              propertyType: "DATE_ONLY",
            },
            value: selectedDate.start,
          },
          {
            definition: {
              id: 12673262,
              name: "To",
              order: 2,
              propertyType: "DATE_ONLY",
            },
            value: selectedDate.end,
          },
          {
            definition: {
              id: 12673263,
              name: "Comment",
              order: 3,
              propertyType: "TEXT",
            },
            value: comment,
          },
          {
            definition: {
              id: 12888200,
              name: "Status",
              order: 4,
              propertyType: "LIST",
            },
            value: "Requested",
          },
        ],
        type: {
          id: itemTypeId.absence,
          name: "Absence",

          company: {
            id: projectList.Føn,
            name: "Føn Services AS",
          },
        },
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to send the request.");
        }
        return response.json();
      })
      .then((data) => {
        // Link the items
        fetch(`https://e2e-tm-prod-services.nsg-e2e.com/api/item/items-link-order/${myUser[0].id}`, {
          method: "POST",
          headers: {
            Authorization: accessToken,
            "Content-Type": "application/json",
            "ocp-apim-subscription-key": "",
          },
          body: JSON.stringify({
            parentItemIds: [],
            childItemIds: [
              {
                id: data[0].id,
              },
            ],
            relatedItemIds: [],
          }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to send the request.");
            }
            return response.json();
          })
          .then((data) => {
            console.log("Success:", data);

            // Update the events with calendar api
            calendarRef.current.getApi().addEvent({
              title: myUser[0].name,
              start: selectedDate.start,
              end: selectedDate.end,
              color: "orange",
              status: "requested",
              fullDay: true,
            });

            // Close the modal
            setModalVisible(false);
          })
          .catch((error) => {
            console.error("Error sending the request:", error);
          });
      })
      .catch((error) => {
        console.error("Error sending the request:", error);
      });

    // Move setModalVisible inside the fetch.then() block
    setModalVisible(false);
  };

  const handleEventClick = ({ event }) => {
    if (activeView === "Manager") {
      setApprovalEvent({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        color: event.backgroundColor,
        comment: event.comment,
      });
      setApprovalModalVisible(true);
    } else {
      // Store the clicked event's information
      setClickedEvent({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        color: event.backgroundColor,
        comment: event.comment,
      });
      setEventModalVisible(true);
    }
  };

  const handleCancel = () => {
    // Close the modal
    setModalVisible(false);
  };

  return (
    <main>
      <div className="flex justify-between items-center my-4 w-[90%] md:w-[80%] mx-auto">
        <div>
          <h1 className="md:text-3xl font-bold text-center">{activeView === "Calendar" ? "My Vacations" : "Manager Calendar"}</h1>
        </div>
        <div className="flex justify-center">
          {isManager && (
            <button
              className={`py-2 px-4 bg-gray-700 text-white rounded-md shadow-md transition duration-300 hover:bg-gray-800 ${
                activeView === "Manager" ? "bg-blue-500 hover:bg-blue-600" : ""
              }`}
              onClick={toggleView}
            >
              {activeView === "Manager" ? "Calendar View" : "Manager View"}
            </button>
          )}
        </div>
      </div>

      {activeView === "Calendar" && (
        <div className="w-[95%] md:w-[80%] mx-auto">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            height="80vh"
            events={events}
            editable={true} // Allows dragging and resizing events
            selectable={true} // Allows selecting time slots
            selectMirror={true} // Temporary display of the selected area
            dayMaxEvents={false} // More events will cause a "+ more" link to display
            select={handleSelect}
            eventClick={handleEventClick}
            firstDay={1}
          />
          {/* Modal for date selection */}
          {modalVisible && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity">
                  <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                  &#8203;
                </span>
                <div className="inline-block align-bottom bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-lg font-bold mb-4">Request Vacation</h2>
                    <div>
                      <p className="text-sm mb-2">
                        <span className="font-semibold">Selected Date:</span>
                      </p>
                      <div className="flex items-center justify-center bg-gray-100 p-2 rounded">
                        <p className="text-sm font-semibold">
                          {moment(selectedDate?.start).tz("Europe/Oslo").format("Do MMMM YYYY")} -{" "}
                          {moment(selectedDate?.end).tz("Europe/Oslo").format("Do MMMM YYYY")}
                        </p>
                      </div>
                    </div>
                    <textarea
                      className="border border-gray-300 w-full mt-4 p-2"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>
                  <div className="px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      className="w-full sm:w-auto inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2 mb-2 sm:mb-0"
                      onClick={handleSend}
                    >
                      Send
                    </button>
                    <button
                      className="w-full sm:w-auto inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mb-2 sm:mb-0"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {eventModalVisible && (
            <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay, animated */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

                {/* This element is to trick the browser into centering the modal contents. */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
                  &#8203;
                </span>

                {/* Modal panel, centered with animation */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                        {/* Icon */}
                        <svg
                          className="h-6 w-6 text-blue-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                          {clickedEvent?.title}
                        </h3>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Start: {moment(clickedEvent?.start).tz("Europe/Oslo").format("Do MMMM YYYY")}</p>
                          <p className="text-sm text-gray-500">End: {moment(clickedEvent?.end).tz("Europe/Oslo").format("Do MMMM YYYY")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => setEventModalVisible(false)}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Close
                    </button>
                    {/* Additional buttons or actions can be added here */}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === "Manager" && (
        <div>
          <div className="w-[95%] md:w-[80%] mx-auto">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              height="80vh"
              events={allVacations}
              dayMaxEvents={false}
              eventClick={handleEventClick}
              firstDay={1}
            />
          </div>
          {approvalModalVisible && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen">
                <div className="bg-gray-500 bg-opacity-75 fixed inset-0"></div>
                <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all max-w-lg w-full p-5">
                  <h3 className="text-lg font-medium text-gray-900">Manage Request</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Title: {approvalEvent?.title}</p>
                    <p className="text-sm text-gray-500">From: {moment(approvalEvent?.start).tz("Europe/Oslo").format("DD.MM.YYYY")}</p>
                    <p className="text-sm text-gray-500">To: {moment(approvalEvent?.end).tz("Europe/Oslo").format("DD.MM.YYYY")}</p>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mt-4">
                      Status
                    </label>
                    <select
                      id="status"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      defaultValue=""
                      onChange={(e) => setApprovalEvent((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="" disabled>
                        Select status
                      </option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    <textarea
                      className="mt-4 p-2 w-full border rounded shadow-sm"
                      placeholder="Add a comment (optional)"
                      onChange={(e) => setApprovalEvent((prev) => ({ ...prev, comment: e.target.value }))}
                      value={approvalEvent?.comment || ""}
                    ></textarea>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      onClick={() => {
                        console.log("approvalEvent", approvalEvent);
                        handleManagerAccept(approvalEvent?.id, approvalEvent?.status, approvalEvent?.comment), setApprovalModalVisible(false);
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="ml-3 inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                      onClick={() => setApprovalModalVisible(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
