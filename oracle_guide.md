# Oracle Instant Client Setup Guide

Oracle Instant Client allows applications to connect to Oracle databases without requiring a full Oracle Database installation.

## Prerequisites

- Ensure you have an Oracle account to download the Instant Client.
- Have administrator/root access to set environment variables.

## Step 1: Download Oracle Instant Client

1. Visit the [Oracle Instant Client download page](https://www.oracle.com/database/technologies/instant-client.html).
2. Select the appropriate version for your operating system:
   - **Windows** (x64)
   - **Linux** (RPM or ZIP)
   - **macOS** (Intel or ARM64)
3. Download the **Basic Package**. If needed, also download the SDK and SQL\*Plus tools.

## Step 2: Extract and Set Environment Variables

### Windows

1. Extract the ZIP file to a directory (e.g., `C:\oracle\instantclient`).
2. Open Command Prompt (cmd) as Administrator and run:
   ```cmd
   setx PATH "C:\oracle\instantclient;%PATH%"
   setx ORACLE_HOME "C:\oracle\instantclient"
   setx TNS_ADMIN "C:\oracle\instantclient"
   ```
3. Restart your computer to apply the changes.

### Linux/macOS

1. Extract the package to `/opt/oracle/instantclient`:
   ```bash
   sudo mkdir -p /opt/oracle
   sudo unzip instantclient-basic-linux.x64-*.zip -d /opt/oracle/
   mv /opt/oracle/instantclient_* /opt/oracle/instantclient
   ```
2. Set environment variables:
   ```bash
   export LD_LIBRARY_PATH=/opt/oracle/instantclient:$LD_LIBRARY_PATH
   export PATH=/opt/oracle/instantclient:$PATH
   export ORACLE_HOME=/opt/oracle/instantclient
   export TNS_ADMIN=/opt/oracle/instantclient
   ```
3. (Optional) If using `sqlplus`, create a symlink:
   ```bash
   sudo ln -s /opt/oracle/instantclient/sqlplus /usr/bin/sqlplus
   ```

### Set Environment Variables Without Cmd on Windows

This guide demonstrates how to set environment variables without using the console for Windows. The process can be done through system settings or programmatically.

#### **Using System Properties**

1. Open **Run** (`Win + R`), type `sysdm.cpl`, and press **Enter**.
2. Go to the **Advanced** tab and click **Environment Variables**.
3. Under **System Variables**, click **New** or select an existing variable and click **Edit**.
4. Enter the **Variable name** (e.g., `ORACLE_HOME`) and **Value** (path to Oracle Instant Client).
5. Click **OK** → **OK** → **OK** to apply changes.
6. Restart your PC for changes to take effect.

---

#### **Using Windows Registry (Programmatically via a File)**

1. Open **Notepad** and paste the following:

   ```reg
   Windows Registry Editor Version 5.00

   [HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Environment]
   "ORACLE_HOME"="C:\\path\\to\\oracle\\instantclient"
   "PATH"=hex(2):25,00,4f,00,52,00,41,00,43,00,4c,00,45,00,5f,00,48,00,4f,00,4d,00,45,00,25,00,3b,00
   ```

---

This guide provides step-by-step instructions to set up Oracle Instant Client. If you encounter any issues, refer to the [official Oracle documentation](https://docs.oracle.com/en/database/oracle/oracle-database/index.html).
