import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, username: string) {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Pusat operasi" })).toBeVisible();
}

test.describe.serial("Citra NET operations", () => {
  test("login and logout preserve the Sanctum session boundary", async ({ page }) => {
    await login(page, "superadmin");
    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("operator navigation is read-only and admin access is denied", async ({ page }) => {
    await login(page, "operator");
    await expect(page.getByRole("link", { name: "Administrator" })).toHaveCount(0);
    await page.getByRole("link", { name: "Pelanggan" }).click();
    await expect(page.getByRole("button", { name: "Tambah pelanggan" })).toHaveCount(0);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Akses dibatasi" })).toBeVisible();
  });

  test("admin can create, edit, and delete a customer", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/pelanggan");
    await page.getByRole("button", { name: "Tambah pelanggan" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nama pelanggan").fill("Pelanggan E2E");
    await dialog.getByLabel("Nomor telepon").fill("08123459999");
    await dialog.getByLabel("Email").fill("e2e@example.test");
    await dialog.getByLabel("Paket layanan").fill("Fiber E2E");
    await dialog.getByLabel("Harga bulanan").fill("425000");
    await dialog.getByLabel("Tanggal langganan").fill("2026-09-23");
    await dialog.getByLabel("Alamat").fill("Jl. Browser Test No. 9, Bogor");
    await dialog.getByLabel("Latitude").fill("-6.6001");
    await dialog.getByLabel("Longitude").fill("106.8101");
    await dialog.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Pelanggan baru ditambahkan.")).toBeVisible();
    await expect(page.getByText("Pelanggan E2E", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Aksi Pelanggan E2E" }).click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await page.getByRole("dialog").getByLabel("Nama pelanggan").fill("Pelanggan E2E Diperbarui");
    await page.getByRole("dialog").getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Data pelanggan diperbarui.")).toBeVisible();

    await page.getByRole("button", { name: "Aksi Pelanggan E2E Diperbarui" }).click();
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus" }).click();
    await expect(page.getByText("Pelanggan dan data terkait dihapus.")).toBeVisible();
    await expect(page.getByText("Pelanggan E2E Diperbarui", { exact: true })).toHaveCount(0);
  });

  test("admin can operate devices, invoices, and reminder queue", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/perangkat");
    await page.getByRole("button", { name: "Tambah perangkat" }).click();
    let dialog = page.getByRole("dialog");
    await dialog.getByLabel("Pelanggan").selectOption({ index: 1 });
    await dialog.getByLabel("Nama perangkat").fill("Router E2E");
    await dialog.getByLabel("IP address").fill("10.20.30.40");
    await dialog.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Perangkat ditambahkan.")).toBeVisible();
    await expect(page.getByText("Router E2E", { exact: true })).toBeVisible();

    await page.goto("/tagihan");
    await page.getByRole("button", { name: "Buat tagihan" }).click();
    dialog = page.getByRole("dialog");
    await dialog.getByLabel("Pelanggan").selectOption({ label: "Pelanggan Seed" });
    await dialog.getByLabel("Periode tagihan").fill("2026-10-01");
    await dialog.getByLabel("Jumlah tagihan").fill("350000");
    await dialog.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Tagihan dibuat.")).toBeVisible();

    const row = page.getByRole("row").filter({ hasText: "Pelanggan Seed" }).filter({ hasText: "01 Okt 2026" });
    await row.getByRole("button", { name: /Aksi tagihan/ }).click();
    await page.getByRole("menuitem", { name: "Kirim reminder" }).click();
    await expect(page.getByText("Reminder masuk antrean.")).toBeVisible();
  });

  test("map renders customer markers and selectable base layers", async ({ page }) => {
    await login(page, "admin");
    await page.goto("/peta");
    await expect(page.getByRole("heading", { name: "Peta jaringan" })).toBeVisible();
    await expect(page.getByText("Pelanggan Seed", { exact: true })).toBeVisible();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await page.locator(".leaflet-control-layers-toggle").hover({ force: true });
    await expect(page.getByText("ESRI Satelit", { exact: true })).toBeVisible();
  });

  test("super admin can manage administrator accounts", async ({ page }) => {
    await login(page, "superadmin");
    await page.goto("/admin");
    await page.getByRole("button", { name: "Tambah admin" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Username").fill("e2e-user");
    await dialog.getByLabel("Email").fill("e2e-user@example.test");
    await dialog.getByLabel("Nama lengkap").fill("E2E User");
    await dialog.getByLabel("Password", { exact: true }).fill("password123");
    await dialog.getByLabel("Konfirmasi password").fill("password123");
    await dialog.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByText("Administrator ditambahkan.")).toBeVisible();
    await page.getByRole("button", { name: "Aksi e2e-user" }).click();
    await page.getByRole("menuitem", { name: "Hapus" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Hapus" }).click();
    await expect(page.getByText("Administrator dihapus.")).toBeVisible();
  });

  test("mobile sidebar opens and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await login(page, "operator");
    await page.getByRole("button", { name: "Toggle Sidebar" }).click();
    await page.getByRole("link", { name: "Perangkat" }).click();
    await expect(page).toHaveURL(/\/perangkat$/);
    await expect(page.getByRole("heading", { name: "Perangkat", exact: true })).toBeVisible();
  });
});
