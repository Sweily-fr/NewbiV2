import { flexRender } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import BankingConnectButton from "@/src/components/banking/BankingConnectButton";

export function MobileTable({ table, columns, error, loading, onRowClick }) {
  return (
    <div className="md:hidden overflow-x-auto">
      <Table className="w-max">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className="border-b border-gray-100 dark:border-gray-400"
            >
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-25 dark:hover:bg-gray-900 cursor-pointer"
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3 px-4 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : error ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-red-500"
              >
                Erreur lors du chargement des transactions
              </TableCell>
            </TableRow>
          ) : loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Chargement...
              </TableCell>
            </TableRow>
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-muted-foreground">
                    Aucune transaction trouvée.
                  </p>
                  <BankingConnectButton />
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
