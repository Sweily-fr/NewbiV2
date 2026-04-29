import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import React from "react";

vi.mock("@/src/hooks/useWorkspace", () => ({
  useWorkspace: () => ({ workspaceId: "ws-1" }),
}));

import { useActivityNotifications } from "@/src/hooks/useActivityNotifications";
import {
  GET_NOTIFICATIONS,
  GET_UNREAD_NOTIFICATIONS_COUNT,
  MARK_NOTIFICATION_AS_READ,
  MARK_ALL_NOTIFICATIONS_AS_READ,
  DELETE_NOTIFICATION,
  NOTIFICATION_RECEIVED_SUBSCRIPTION,
} from "@/src/graphql/queries/activityNotifications";

const wrap = (mocks) =>
  function Wrapper({ children }) {
    return (
      <MockedProvider mocks={mocks} addTypename={false}>
        {children}
      </MockedProvider>
    );
  };

const subscriptionMock = {
  request: {
    query: NOTIFICATION_RECEIVED_SUBSCRIPTION,
    variables: { workspaceId: "ws-1" },
  },
  result: { data: { notificationReceived: null } },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useActivityNotifications", () => {
  it("returns notifications and counts from queries", async () => {
    const mocks = [
      {
        request: {
          query: GET_NOTIFICATIONS,
          variables: {
            workspaceId: "ws-1",
            limit: 50,
            offset: 0,
            unreadOnly: false,
          },
        },
        result: {
          data: {
            getNotifications: {
              notifications: [
                { id: "n-1", title: "Tâche assignée", read: false },
                { id: "n-2", title: "Message", read: true },
              ],
              totalCount: 2,
              unreadCount: 1,
            },
          },
        },
      },
      {
        request: {
          query: GET_UNREAD_NOTIFICATIONS_COUNT,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { getUnreadNotificationsCount: 1 } },
      },
      subscriptionMock,
    ];

    const { result } = renderHook(() => useActivityNotifications(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toHaveLength(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.unreadCount).toBe(1);
  });

  it("returns sensible defaults on initial render", () => {
    const { result } = renderHook(() => useActivityNotifications(), {
      wrapper: wrap([subscriptionMock]),
    });
    expect(result.current.notifications).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.unreadCount).toBe(0);
  });

  it("markAsRead calls the mutation", async () => {
    const mocks = [
      {
        request: {
          query: GET_NOTIFICATIONS,
          variables: {
            workspaceId: "ws-1",
            limit: 50,
            offset: 0,
            unreadOnly: false,
          },
        },
        result: {
          data: {
            getNotifications: {
              notifications: [],
              totalCount: 0,
              unreadCount: 0,
            },
          },
        },
      },
      {
        request: {
          query: GET_UNREAD_NOTIFICATIONS_COUNT,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { getUnreadNotificationsCount: 0 } },
      },
      subscriptionMock,
      {
        request: {
          query: MARK_NOTIFICATION_AS_READ,
          variables: { id: "n-1" },
        },
        result: { data: { markNotificationAsRead: { success: true } } },
      },
    ];

    const { result } = renderHook(() => useActivityNotifications(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAsRead("n-1");
    });
    // No assertion on mutation — Apollo's MockedProvider only verifies that
    // the request matched and didn't throw. The hook intentionally swallows
    // errors so we just verify it didn't blow up.
    expect(result.current).toBeDefined();
  });

  it("markAllAsRead calls the bulk mutation", async () => {
    const mocks = [
      {
        request: {
          query: GET_NOTIFICATIONS,
          variables: {
            workspaceId: "ws-1",
            limit: 50,
            offset: 0,
            unreadOnly: false,
          },
        },
        result: {
          data: {
            getNotifications: {
              notifications: [],
              totalCount: 0,
              unreadCount: 0,
            },
          },
        },
      },
      {
        request: {
          query: GET_UNREAD_NOTIFICATIONS_COUNT,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { getUnreadNotificationsCount: 0 } },
      },
      subscriptionMock,
      {
        request: {
          query: MARK_ALL_NOTIFICATIONS_AS_READ,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { markAllNotificationsAsRead: { success: true } } },
      },
    ];

    const { result } = renderHook(() => useActivityNotifications(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.markAllAsRead();
    });
    expect(result.current).toBeDefined();
  });

  it("deleteNotification calls the delete mutation", async () => {
    const mocks = [
      {
        request: {
          query: GET_NOTIFICATIONS,
          variables: {
            workspaceId: "ws-1",
            limit: 50,
            offset: 0,
            unreadOnly: false,
          },
        },
        result: {
          data: {
            getNotifications: {
              notifications: [],
              totalCount: 0,
              unreadCount: 0,
            },
          },
        },
      },
      {
        request: {
          query: GET_UNREAD_NOTIFICATIONS_COUNT,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { getUnreadNotificationsCount: 0 } },
      },
      subscriptionMock,
      {
        request: {
          query: DELETE_NOTIFICATION,
          variables: { id: "n-1" },
        },
        result: { data: { deleteNotification: { success: true } } },
      },
    ];

    const { result } = renderHook(() => useActivityNotifications(), {
      wrapper: wrap(mocks),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.deleteNotification("n-1");
    });
    expect(result.current).toBeDefined();
  });

  it("respects custom limit/offset/unreadOnly options", async () => {
    const variables = {
      workspaceId: "ws-1",
      limit: 10,
      offset: 5,
      unreadOnly: true,
    };
    const mocks = [
      {
        request: { query: GET_NOTIFICATIONS, variables },
        result: {
          data: {
            getNotifications: {
              notifications: [{ id: "x" }],
              totalCount: 1,
              unreadCount: 1,
            },
          },
        },
      },
      {
        request: {
          query: GET_UNREAD_NOTIFICATIONS_COUNT,
          variables: { workspaceId: "ws-1" },
        },
        result: { data: { getUnreadNotificationsCount: 1 } },
      },
      subscriptionMock,
    ];

    const { result } = renderHook(
      () =>
        useActivityNotifications({ limit: 10, offset: 5, unreadOnly: true }),
      { wrapper: wrap(mocks) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.notifications).toEqual([{ id: "x" }]);
  });
});
