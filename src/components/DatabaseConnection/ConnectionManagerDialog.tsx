import { useAtom } from "jotai/react";
import {
  Modal,
  Menu,
  Input,
  Select,
  Button,
  Form,
  notification,
  Space,
} from "antd";
import type { MenuProps } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState, useEffect } from "react";
import { FileOutlined } from "@ant-design/icons";
import "./Database.scss";
import {
  connectionsAtom,
  Connection,
  DatabaseType,
  CONNECTION_TYPES,
  DEFAULT_PORTS,
  getDefaultConnection,
  ButtonState,
} from "../../state/connection";

const SQLiteFileExtensions = ["db", "sqlite", "sqlite3", "db3"];

const ConnectionFormFields = ({
  connectionType,
  form,
  onFileSelect,
}: {
  connectionType: DatabaseType;
  form: any;
  onFileSelect: () => void;
}) => {
  const filePath = Form.useWatch("url", form);

  if (connectionType === "SQLite") {
    return (
      <Form.Item
        label="File"
        name="url"
        rules={[{ required: true, message: "Please select a database file" }]}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="Click browse to select a database file"
            readOnly
            value={filePath}
            prefix={<FileOutlined />}
            style={{ cursor: "pointer", backgroundColor: "#fafafa" }}
            onClick={onFileSelect}
            className="file-path-input"
          />
        </Space.Compact>
        <div className="file-hint">
          Select an SQLite database file ({SQLiteFileExtensions.join(", ")})
        </div>
      </Form.Item>
    );
  }

  return (
    <>
      <Form.Item
        label="URL"
        name="url"
        rules={[{ required: true }]}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Port"
        name="port"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Input type="number" />
      </Form.Item>
      <Form.Item
        label="Database"
        name="database"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="User"
        name="user"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Input.Password
          visibilityToggle={false}
          placeholder={form.getFieldValue("password") ? "********" : ""}
        />
      </Form.Item>
    </>
  );
};

const ConnectionManagerDialog = ({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) => {
  const [state, setState] = useAtom(connectionsAtom);
  const {
    connections = [],
    selectedConnectionId,
    connectionStates = {},
  } = state;
  const selectedConnection = connections.find(
    (c) => c.id === selectedConnectionId
  );

  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [buttonState, setButtonState] = useState<ButtonState>("default");

  const connectionType = Form.useWatch("type", form);

  // Initialize form with selected connection or defaults
  useEffect(() => {
    if (!selectedConnection) {
      form.resetFields();
      setButtonState("default");
      return;
    }

    const values = {
      ...selectedConnection,
      port: selectedConnection.port ?? DEFAULT_PORTS[selectedConnection.type],
    };

    form.setFieldsValue(values);
    setButtonState(connectionStates[selectedConnection.id] || "default");
  }, [selectedConnection, form, connectionStates]);

  // Update default port when connection type changes
  useEffect(() => {
    if (connectionType && selectedConnectionId) {
      const currentPort = form.getFieldValue("port");
      // Only set default port if there's no port value already set
      if (!currentPort) {
        const defaultPort = DEFAULT_PORTS[connectionType as DatabaseType];
        form.setFieldsValue({ port: defaultPort });
        updateConnectionField("port", defaultPort);
      }
    }
  }, [connectionType, selectedConnectionId, form]);

  const updateConnectionField = (field: string, value: any) => {
    if (!selectedConnectionId) return;
    setState((prev) => ({
      ...prev,
      connections: prev.connections.map((conn) =>
        conn.id === selectedConnectionId ? { ...conn, [field]: value } : conn
      ),
    }));
  };

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    if (!e?.key) return;
    setState((prev) => ({ ...prev, selectedConnectionId: e.key }));
    setButtonState(connectionStates[e.key] || "default");
  };

  const handleAddConnection = () => {
    const newConnection = getDefaultConnection();
    setState((prev) => ({
      ...prev,
      connections: [...prev.connections, newConnection],
      selectedConnectionId: newConnection.id,
    }));
    form.setFieldsValue(newConnection);
    setButtonState("default");
  };

  const handleTestConnection = async () => {
    setButtonState("testing");
    try {
      const values = await form.validateFields();
      const payload =
        values.type === "SQLite"
          ? { name: values.name, type: values.type, url: values.url }
          : { ...values, port: values.port ? Number(values.port) : undefined };

      const success = await invoke("test_connection", { config: payload });

      if (success) {
        const newState = "connected";
        setButtonState(newState);
        if (selectedConnectionId) {
          setState((prev) => ({
            ...prev,
            connectionStates: {
              ...(prev.connectionStates || {}),
              [selectedConnectionId]: newState,
            },
          }));
        }
        updateLastTested();
        showNotification("success", "Connection successful!");
      } else {
        const newState = "failed";
        setButtonState(newState);
        if (selectedConnectionId) {
          setState((prev) => ({
            ...prev,
            connectionStates: {
              ...(prev.connectionStates || {}),
              [selectedConnectionId]: newState,
            },
          }));
        }
        showNotification("error", "Connection failed!");
      }
    } catch (error) {
      console.error("Connection error:", error);
      setButtonState("failed");
      showNotification(
        "error",
        `Connection error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const updateLastTested = () => {
    if (!selectedConnectionId) return;
    setState((prev) => ({
      ...prev,
      connections: prev.connections.map((conn) =>
        conn.id === selectedConnectionId
          ? { ...conn, lastTested: new Date().toISOString() }
          : conn
      ),
    }));
  };

  const showNotification = (type: "success" | "error", message: string) => {
    api[type]({ message, placement: "topRight" });
  };

  const handleValuesChange = (changedValues: Partial<Connection>) => {
    if (!selectedConnectionId) return;
    setButtonState("default");

    // Convert port to number if it's being changed
    const processedChanges = {
      ...changedValues,
      port: changedValues.port ? Number(changedValues.port) : undefined,
    };

    setState((prev) => ({
      ...prev,
      connections: prev.connections.map((conn) =>
        conn.id === selectedConnectionId
          ? { ...conn, ...processedChanges }
          : conn
      ),
      connectionStates: {
        ...(prev.connectionStates || {}),
        [selectedConnectionId]: "default",
      },
    }));
  };

  const handleDeleteConnection = () => {
    if (!selectedConnectionId) return;

    setState((prev) => {
      const newConnectionStates = { ...(prev.connectionStates || {}) };
      delete newConnectionStates[selectedConnectionId];

      return {
        ...prev,
        connections: prev.connections.filter(
          (conn) => conn.id !== selectedConnectionId
        ),
        selectedConnectionId: undefined,
        connectionStates: newConnectionStates,
      };
    });

    form.resetFields();
    setButtonState("default");
  };

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          { name: "SQLite Database", extensions: SQLiteFileExtensions },
          { name: "All Files", extensions: ["*"] },
        ],
        title: "Select SQLite Database File",
      });

      if (selected && typeof selected === "string") {
        form.setFieldsValue({ url: selected });
        updateConnectionField("url", selected);
        showNotification("success", "File selected successfully");
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      showNotification("error", "Failed to select file");
    }
  };

  return (
    <Modal
      title="SQL Connection Manager"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      {contextHolder}
      <div className="connection-manager">
        <div className="left-panel">
          <div className="connection-list">
            <Menu
              mode="inline"
              selectedKeys={selectedConnection ? [selectedConnection.id] : []}
              onClick={handleMenuClick}
              items={connections.map((c) => ({
                key: c.id,
                label: c.name,
              }))}
            />
          </div>
          <Button
            type="primary"
            onClick={handleAddConnection}
            className="add-button"
          >
            Add Connection
          </Button>
        </div>

        <div className="right-panel">
          <Form
            form={form}
            layout="horizontal"
            onValuesChange={handleValuesChange}
          >
            <Form.Item
              label="Name"
              name="name"
              rules={[{ required: true }]}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true }]}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
            >
              <Select
                options={CONNECTION_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </Form.Item>

            <ConnectionFormFields
              connectionType={connectionType}
              form={form}
              onFileSelect={handleFileSelect}
            />

            <div className="button-group">
              <Button
                type="primary"
                onClick={handleTestConnection}
                style={{ marginRight: 8 }}
                loading={buttonState === "testing"}
              >
                {buttonState === "testing" ? "Testing..." : "Test Connection"}
              </Button>
              <Button
                danger
                onClick={handleDeleteConnection}
                disabled={!selectedConnection}
              >
                Delete
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </Modal>
  );
};

export default ConnectionManagerDialog;
