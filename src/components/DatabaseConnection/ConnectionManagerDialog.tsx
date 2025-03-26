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
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import { atom } from "jotai";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState, useEffect } from "react";
import { FileOutlined, FolderOpenOutlined } from "@ant-design/icons";
import "./Database.scss";

const { Text } = Typography;
type Connection = {
  id: string;
  name: string;
  type: "Oracle" | "MySQL" | "PostgreSQL" | "SQLite";
  url: string;
  port?: number;
  user?: string;
  password?: string;
};

const connectionTypes = ["Oracle", "MySQL", "PostgreSQL", "SQLite"];

// Default ports for each database type
const defaultPorts: Record<string, number> = {
  Oracle: 1521,
  MySQL: 3306,
  PostgreSQL: 5432,
  SQLite: 0, // SQLite doesn't require a port
};

// Jotai atoms for state management
export const connectionsAtom = atom<Connection[]>([]);
export const selectedConnectionAtom = atom<Connection | null>(null);

export default function ConnectionManagerDialog({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [connections, setConnections] = useAtom(connectionsAtom);
  const [selectedConnection, setSelectedConnection] = useAtom(
    selectedConnectionAtom
  );
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [buttonState, setButtonState] = useState<
    "default" | "testing" | "connected" | "failed"
  >("default");

  const connectionType = Form.useWatch("type", form);
  useEffect(() => {
    if (connectionType && defaultPorts[connectionType] !== undefined) {
      form.setFieldsValue({ port: defaultPorts[connectionType] });
    }
  }, [connectionType, form]);
  const handleMenuClick: MenuProps["onClick"] = (e) => {
    const connection = connections.find((c) => c.id === e.key);
    if (connection) {
      setSelectedConnection(connection);
      form.setFieldsValue(connection);
    }
  };

  const handleAddConnection = () => {
    const newConnection: Connection = {
      id: Date.now().toString(),
      name: "New Connection",
      type: "MySQL",
      url: "",
      port: 3306,
      user: "",
      password: "",
    };
    setConnections([...connections, newConnection]);
    setSelectedConnection(newConnection);
    form.setFieldsValue(newConnection);
  };

  const handleTestConnection = async () => {
    setButtonState("testing"); // Change button state to 'testing'
    try {
      const values = await form.validateFields();
      const payload =
        values.type === "SQLite"
          ? {
              name: values.name,
              type: values.type,
              url: values.url,
            }
          : {
              ...values,
              port: values.port ? Number(values.port) : undefined,
            };
      const success = await invoke("test_connection", { config: payload });

      if (success) {
        setButtonState("connected"); // Change button state to 'connected'
        api.success({
          message: "Connection successful!",
          placement: "topRight",
        });
      } else {
        setButtonState("failed"); // Change button state to 'failed'
        api.error({ message: "Connection failed!", placement: "topRight" });
      }
    } catch (error) {
      console.error("Connection error:", error);
      setButtonState("failed"); // Change button state to 'failed'
      api.error({
        message: "Connection error." + error,
        placement: "topRight",
      });
    }
  };
  const handleValuesChange = (changedValues: Partial<Connection>) => {
    if (!selectedConnection) return;

    // Update the selected connection object
    const updatedConnection = { ...selectedConnection, ...changedValues };

    // Update the connections array
    setConnections((prev) =>
      prev.map((conn) =>
        conn.id === selectedConnection.id ? updatedConnection : conn
      )
    );

    // Update the selected connection state
    setSelectedConnection(updatedConnection);
  };
  const handleDeleteConnection = () => {
    if (selectedConnection) {
      setConnections(connections.filter((c) => c.id !== selectedConnection.id));
      setSelectedConnection(null);
      form.resetFields();
    }
  };

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: "SQLite Database",
            extensions: ["db", "sqlite", "sqlite3", "db3"],
          },
          {
            name: "All Files",
            extensions: ["*"],
          },
        ],
        title: "Select SQLite Database File",
      });

      if (selected && typeof selected === "string") {
        form.setFieldsValue({ url: selected });
        api.success({
          message: "File selected successfully",
          description: selected,
          placement: "topRight",
        });
      } else {
        api.warning({
          message: "No file selected",
          placement: "topRight",
        });
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      api.error({
        message: "Failed to select file",
        description: error instanceof Error ? error.message : String(error),
        placement: "topRight",
      });
    }
  };
  const formatFilePath = (path: string) => {
    if (!path) return null;
    const parts = path.split(/[\\/]/);
    if (parts.length <= 2) return path;
    return `.../${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  };

  const filePath = Form.useWatch("url", form);
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
                options={connectionTypes.map((t) => ({ value: t, label: t }))}
              />
            </Form.Item>

            {connectionType === "SQLite" ? (
              <Form.Item
                label="Database File"
                name="url"
                rules={[
                  {
                    required: true,
                    message: "Please select a database file",
                  },
                ]}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Click browse to select a database file"
                    readOnly
                    value={form.getFieldValue("url")}
                    prefix={<FileOutlined />}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "#fafafa",
                    }}
                    onClick={handleFileSelect}
                    className="file-path-input"
                  />
                </Space.Compact>
                <div className="file-hint">
                  Select an SQLite database file (.db, .sqlite, .sqlite3, .db3)
                </div>
              </Form.Item>
            ) : (
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
                  <Input.Password />
                </Form.Item>
              </>
            )}

            <div className="button-group">
              <Button
                type="primary"
                onClick={handleTestConnection}
                style={{ marginRight: 8 }}
                loading={buttonState === "testing"}
              >
                {buttonState === "testing"
                  ? "Testing..."
                  : buttonState === "connected"
                  ? "Test Connection"
                  : "Test Connection"}
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
}
